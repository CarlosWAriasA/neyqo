import { env } from './config/env';
import { NeyqoApiClient } from './clients/neyqo-api/neyqo-api-client';
import { logger } from './core/logging/logger';
import { JobScheduler } from './core/scheduler/scheduler';
import { workerDataSource } from './database/data-source';
import { buildHealthServer } from './health/health-server';
import { EmailSyncJob } from './jobs/email-sync/job';
import { PendingEmailTransactionParser } from './jobs/email-sync/email-transaction-parser';
import { GmailEmailProvider } from './jobs/email-sync/providers/gmail-email-provider';
import { OutlookEmailProvider } from './jobs/email-sync/providers/outlook-email-provider';
import { ScheduledTransactionsJob } from './jobs/scheduled-transactions/job';
import { ScheduledTransactionsRepository } from './jobs/scheduled-transactions/repository';
import { ScheduledTransactionsService } from './jobs/scheduled-transactions/service';

async function bootstrap() {
  if (env.workerEnabled && !env.internalServiceSecret) {
    throw new Error('INTERNAL_SERVICE_SECRET es obligatorio cuando WORKER_ENABLED=true.');
  }

  await workerDataSource.initialize();

  const apiClient = new NeyqoApiClient(env.neyqoApiBaseUrl, env.internalServiceSecret);
  const scheduledRepository = new ScheduledTransactionsRepository(workerDataSource);
  const scheduledService = new ScheduledTransactionsService(scheduledRepository, apiClient, {
    batchSize: env.scheduledTransactions.batchSize,
    maxCatchUpPerRecord: env.scheduledTransactions.maxCatchUpPerRecord,
    lockTtlMs: env.scheduledTransactions.lockTtlMs,
    workerInstanceId: env.workerInstanceId,
    retry: env.retries,
  });
  const scheduler = new JobScheduler([
    new ScheduledTransactionsJob(
      env.scheduledTransactions.enabled,
      env.scheduledTransactions.intervalMs,
      scheduledService,
    ),
    new EmailSyncJob(
      env.emailSync.enabled,
      env.emailSync.intervalMs,
      [new GmailEmailProvider(), new OutlookEmailProvider()],
      new PendingEmailTransactionParser(),
    ),
  ]);
  const app = buildHealthServer({
    dataSource: workerDataSource,
    apiClient,
    scheduler,
  });

  await app.listen({
    host: '0.0.0.0',
    port: env.port,
  });

  if (env.workerEnabled) {
    scheduler.start();
  } else {
    logger.warn('Worker iniciado con scheduler desactivado por configuración.');
  }

  logger.info('Neyqo worker iniciado.', {
    port: env.port,
    workerInstanceId: env.workerInstanceId,
    workerEnabled: env.workerEnabled,
  });

  const shutdown = async (signal: string) => {
    logger.info('Apagando worker.', { signal });
    await scheduler.stop();
    await app.close();
    await workerDataSource.destroy();
    process.exit(0);
  };

  process.once('SIGTERM', () => {
    void shutdown('SIGTERM');
  });

  process.once('SIGINT', () => {
    void shutdown('SIGINT');
  });
}

bootstrap().catch((error) => {
  logger.error('No fue posible iniciar el worker.', error);
  process.exit(1);
});
