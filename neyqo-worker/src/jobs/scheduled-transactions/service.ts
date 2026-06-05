import { NeyqoApiError, type NeyqoApiClient } from '../../clients/neyqo-api/neyqo-api-client';
import { logger } from '../../core/logging/logger';
import { withRetries } from '../../core/retries/retry';
import type { JobExecutionContext, JobExecutionResult } from '../../core/scheduler/types';
import { toDateOnly, resolveDueExecutionDates, resolveNextExecutionDate } from './date-utils';
import type { ScheduledTransactionsRepository } from './repository';
import type { ScheduledTransactionRecord, ScheduledTransactionsJobOptions } from './types';

interface Counters {
  processedCount: number;
  successCount: number;
  failedCount: number;
}

function truncateErrorMessage(message: string): string {
  return message.length > 1000 ? `${message.slice(0, 997)}...` : message;
}

function isRetryableApiError(error: unknown): boolean {
  if (error instanceof NeyqoApiError) {
    return error.retryable;
  }

  return error instanceof TypeError;
}

function isPermanentApiError(error: unknown): boolean {
  return error instanceof NeyqoApiError && !error.retryable;
}

export class ScheduledTransactionsService {
  constructor(
    private readonly repository: ScheduledTransactionsRepository,
    private readonly apiClient: NeyqoApiClient,
    private readonly options: ScheduledTransactionsJobOptions,
  ) {}

  async execute(context: JobExecutionContext, jobName: string): Promise<JobExecutionResult> {
    const runId = await this.repository.createJobRun({
      jobName,
      workerInstanceId: this.options.workerInstanceId,
    });
    const counters: Counters = {
      processedCount: 0,
      successCount: 0,
      failedCount: 0,
    };
    let runErrorMessage: string | undefined;

    try {
      const targetDate = toDateOnly(new Date());
      const schedules = await this.repository.claimPending({
        targetDate,
        batchSize: this.options.batchSize,
        workerInstanceId: this.options.workerInstanceId,
        lockTtlMs: this.options.lockTtlMs,
        userId: context.userId,
      });

      for (const schedule of schedules) {
        await this.processSchedule(runId, jobName, schedule, targetDate, counters);
      }

      const status = counters.failedCount === 0 ? 'success' : counters.successCount > 0 ? 'partial_success' : 'failed';
      await this.repository.finishJobRun({
        jobRunId: runId,
        status,
        processedCount: counters.processedCount,
        successCount: counters.successCount,
        failedCount: counters.failedCount,
        errorMessage: runErrorMessage,
      });

      return {
        ...counters,
        status,
        errorMessage: runErrorMessage,
      };
    } catch (error) {
      runErrorMessage = error instanceof Error ? error.message : 'Error desconocido.';
      logger.error('Falló el ciclo de transacciones programadas.', error, { jobName });

      await this.repository.finishJobRun({
        jobRunId: runId,
        status: 'failed',
        processedCount: counters.processedCount,
        successCount: counters.successCount,
        failedCount: counters.failedCount || 1,
        errorMessage: truncateErrorMessage(runErrorMessage),
      });

      return {
        processedCount: counters.processedCount,
        successCount: counters.successCount,
        failedCount: counters.failedCount || 1,
        status: 'failed',
        errorMessage: runErrorMessage,
      };
    }
  }

  private async processSchedule(
    runId: string,
    jobName: string,
    schedule: ScheduledTransactionRecord,
    targetDate: string,
    counters: Counters,
  ): Promise<void> {
    let dueDates: string[];

    try {
      dueDates = resolveDueExecutionDates(schedule, targetDate, this.options.maxCatchUpPerRecord);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Configuración inválida.';
      counters.failedCount += 1;
      await this.repository.recordJobError({
        jobRunId: runId,
        jobName,
        entityType: 'scheduled_transaction',
        entityId: schedule.id,
        attempt: 1,
        errorMessage: truncateErrorMessage(errorMessage),
      });
      await this.repository.pauseWithError({
        scheduledTransactionId: schedule.id,
        workerInstanceId: this.options.workerInstanceId,
        errorMessage: truncateErrorMessage(errorMessage),
      });
      return;
    }

    if (dueDates.length === 0) {
      await this.repository.release({
        scheduledTransactionId: schedule.id,
        workerInstanceId: this.options.workerInstanceId,
      });
      return;
    }

    let lastSuccessfulExecutionDate: string | undefined;

    for (const executionDate of dueDates) {
      counters.processedCount += 1;

      try {
        await withRetries(
          async () => {
            await this.apiClient.createInternalTransaction({
              userId: schedule.userId,
              type: schedule.type,
              amount: Number(schedule.amount),
              sourceAccountId: schedule.sourceAccountId,
              categoryId: schedule.categoryId,
              description: schedule.description || schedule.name,
              date: executionDate,
              status: 'completed',
              source: 'scheduled_transaction',
              scheduledTransactionId: schedule.id,
              scheduledExecutionDate: executionDate,
              processedAt: new Date().toISOString(),
            });
          },
          {
            maxRetries: this.options.retry.maxRetries,
            retryDelayMs: this.options.retry.retryDelayMs,
            isRetryable: isRetryableApiError,
            onRetry: async (error, attempt) => {
              await this.repository.recordJobError({
                jobRunId: runId,
                jobName,
                entityType: 'scheduled_transaction',
                entityId: schedule.id,
                attempt,
                errorMessage: truncateErrorMessage(error instanceof Error ? error.message : 'Error temporal.'),
              });
            },
          },
        );

        counters.successCount += 1;
        lastSuccessfulExecutionDate = executionDate;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'No fue posible procesar el programado.';
        counters.failedCount += 1;

        await this.repository.recordJobError({
          jobRunId: runId,
          jobName,
          entityType: 'scheduled_transaction',
          entityId: schedule.id,
          attempt: this.options.retry.maxRetries + 1,
          errorMessage: truncateErrorMessage(errorMessage),
        });

        if (isPermanentApiError(error)) {
          await this.repository.pauseWithError({
            scheduledTransactionId: schedule.id,
            workerInstanceId: this.options.workerInstanceId,
            errorMessage: truncateErrorMessage(errorMessage),
          });
          return;
        }

        await this.repository.release({
          scheduledTransactionId: schedule.id,
          workerInstanceId: this.options.workerInstanceId,
          errorMessage: truncateErrorMessage(errorMessage),
        });
        return;
      }
    }

    if (!lastSuccessfulExecutionDate) {
      await this.repository.release({
        scheduledTransactionId: schedule.id,
        workerInstanceId: this.options.workerInstanceId,
      });
      return;
    }

    const nextExecutionDate = resolveNextExecutionDate(schedule, lastSuccessfulExecutionDate);
    const completed = Boolean(schedule.endDate && nextExecutionDate > schedule.endDate);

    await this.repository.updateAfterSuccess({
      scheduledTransactionId: schedule.id,
      workerInstanceId: this.options.workerInstanceId,
      lastExecutionDate: lastSuccessfulExecutionDate,
      nextExecutionDate,
      completed,
    });
  }
}
