import type { DataSource } from 'typeorm';
import type { WorkerJobRunStatus } from '../../database/entities/worker-job-run.entity';
import type { ScheduledTransactionRecord } from './types';

interface ScheduledTransactionRow {
  id: string;
  user_id: string;
  type: 'income' | 'expense';
  name: string;
  description: string;
  amount: string;
  source_account_id: string;
  category_id: string;
  frequency: 'weekly' | 'biweekly' | 'monthly' | 'yearly';
  day_of_week: number | null;
  days_of_month: number[] | null;
  month_of_year: number | null;
  start_date: string;
  end_date: string | null;
  next_execution_date: string;
  last_execution_date: string | null;
  status: 'active' | 'paused' | 'completed';
  locked_by: string | null;
  locked_until: Date | null;
  last_error: string | null;
  created_at: Date;
  updated_at: Date;
}

function mapScheduledTransaction(row: ScheduledTransactionRow): ScheduledTransactionRecord {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    name: row.name,
    description: row.description,
    amount: row.amount,
    sourceAccountId: row.source_account_id,
    categoryId: row.category_id,
    frequency: row.frequency,
    dayOfWeek: row.day_of_week,
    daysOfMonth: row.days_of_month,
    monthOfYear: row.month_of_year,
    startDate: row.start_date,
    endDate: row.end_date,
    nextExecutionDate: row.next_execution_date,
    lastExecutionDate: row.last_execution_date,
    status: row.status,
    lockedBy: row.locked_by,
    lockedUntil: row.locked_until,
    lastError: row.last_error,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class ScheduledTransactionsRepository {
  constructor(private readonly dataSource: DataSource) {}

  async claimPending(params: {
    targetDate: string;
    batchSize: number;
    workerInstanceId: string;
    lockTtlMs: number;
    userId?: string;
  }): Promise<ScheduledTransactionRecord[]> {
    const rows = await this.dataSource.query<ScheduledTransactionRow[]>(
      `
        WITH candidates AS (
          SELECT id
          FROM scheduled_transactions
          WHERE status = 'active'
            AND next_execution_date <= $1
            AND ($2::uuid IS NULL OR user_id = $2::uuid)
            AND (locked_until IS NULL OR locked_until < now())
          ORDER BY next_execution_date ASC, created_at ASC
          LIMIT $3
          FOR UPDATE SKIP LOCKED
        )
        UPDATE scheduled_transactions scheduled
        SET locked_by = $4,
            locked_until = now() + ($5::text || ' milliseconds')::interval,
            updated_at = now()
        FROM candidates
        WHERE scheduled.id = candidates.id
        RETURNING scheduled.*
      `,
      [params.targetDate, params.userId ?? null, params.batchSize, params.workerInstanceId, params.lockTtlMs],
    );

    return rows.map(mapScheduledTransaction);
  }

  async updateAfterSuccess(params: {
    scheduledTransactionId: string;
    workerInstanceId: string;
    lastExecutionDate: string;
    nextExecutionDate: string;
    completed: boolean;
  }): Promise<void> {
    await this.dataSource.query(
      `
        UPDATE scheduled_transactions
        SET last_execution_date = $1,
            next_execution_date = $2,
            status = CASE WHEN $3::boolean THEN 'completed' ELSE status END,
            locked_by = NULL,
            locked_until = NULL,
            last_error = NULL,
            updated_at = now()
        WHERE id = $4
          AND locked_by = $5
      `,
      [
        params.lastExecutionDate,
        params.nextExecutionDate,
        params.completed,
        params.scheduledTransactionId,
        params.workerInstanceId,
      ],
    );
  }

  async release(params: {
    scheduledTransactionId: string;
    workerInstanceId: string;
    errorMessage?: string;
  }): Promise<void> {
    await this.dataSource.query(
      `
        UPDATE scheduled_transactions
        SET locked_by = NULL,
            locked_until = NULL,
            last_error = $1,
            updated_at = now()
        WHERE id = $2
          AND locked_by = $3
      `,
      [params.errorMessage ?? null, params.scheduledTransactionId, params.workerInstanceId],
    );
  }

  async pauseWithError(params: {
    scheduledTransactionId: string;
    workerInstanceId: string;
    errorMessage: string;
  }): Promise<void> {
    await this.dataSource.query(
      `
        UPDATE scheduled_transactions
        SET status = 'paused',
            locked_by = NULL,
            locked_until = NULL,
            last_error = $1,
            updated_at = now()
        WHERE id = $2
          AND locked_by = $3
      `,
      [params.errorMessage, params.scheduledTransactionId, params.workerInstanceId],
    );
  }

  async createJobRun(params: { jobName: string; workerInstanceId: string }): Promise<string> {
    const rows = await this.dataSource.query<Array<{ id: string }>>(
      `
        INSERT INTO worker_job_runs(job_name, worker_instance_id, started_at, status)
        VALUES ($1, $2, now(), 'running')
        RETURNING id
      `,
      [params.jobName, params.workerInstanceId],
    );

    return rows[0].id;
  }

  async finishJobRun(params: {
    jobRunId: string;
    status: WorkerJobRunStatus;
    processedCount: number;
    successCount: number;
    failedCount: number;
    errorMessage?: string;
  }): Promise<void> {
    await this.dataSource.query(
      `
        UPDATE worker_job_runs
        SET finished_at = now(),
            status = $1,
            processed_count = $2,
            success_count = $3,
            failed_count = $4,
            error_message = $5
        WHERE id = $6
      `,
      [
        params.status,
        params.processedCount,
        params.successCount,
        params.failedCount,
        params.errorMessage ?? null,
        params.jobRunId,
      ],
    );
  }

  async recordJobError(params: {
    jobRunId: string;
    jobName: string;
    entityType: string;
    entityId: string;
    attempt: number;
    errorMessage: string;
  }): Promise<void> {
    await this.dataSource.query(
      `
        INSERT INTO worker_job_errors(job_run_id, job_name, entity_type, entity_id, attempt, error_message)
        VALUES ($1, $2, $3, $4, $5, $6)
      `,
      [
        params.jobRunId,
        params.jobName,
        params.entityType,
        params.entityId,
        params.attempt,
        params.errorMessage,
      ],
    );
  }
}
