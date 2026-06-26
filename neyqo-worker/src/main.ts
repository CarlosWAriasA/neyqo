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
import { ExternalTokenCipher } from './jobs/email-sync/token-cipher';
import type { EmailProvider } from './jobs/email-sync/types';
import { ScheduledTransactionsJob } from './jobs/scheduled-transactions/job';
import { ScheduledTransactionsRepository } from './jobs/scheduled-transactions/repository';
import { ScheduledTransactionsService } from './jobs/scheduled-transactions/service';

async function bootstrap() {
  if (env.workerEnabled && !env.internalServiceSecret) {
    throw new Error('INTERNAL_SERVICE_SECRET es obligatorio cuando WORKER_ENABLED=true.');
  }

  if (env.workerEnabled && env.emailSync.enabled && !env.externalTokenEncryptionKey) {
    throw new Error('EXTERNAL_TOKEN_ENCRYPTION_KEY es obligatorio cuando EMAIL_SYNC_JOB_ENABLED=true.');
  }

  await workerDataSource.initialize();

  const apiClient = new NeyqoApiClient(env.neyqoApiBaseUrl, env.internalServiceSecret);
  const externalTokenCipher = env.externalTokenEncryptionKey
    ? new ExternalTokenCipher(env.externalTokenEncryptionKey)
    : undefined;
  const emailProviders: EmailProvider[] = [];

  if (externalTokenCipher && env.googleClientId && env.googleClientSecret) {
    emailProviders.push(
      new GmailEmailProvider(workerDataSource, externalTokenCipher, {
        clientId: env.googleClientId,
        clientSecret: env.googleClientSecret,
      }),
    );
  }

  if (externalTokenCipher && env.microsoftClientId && env.microsoftClientSecret) {
    emailProviders.push(
      new OutlookEmailProvider(workerDataSource, externalTokenCipher, {
        clientId: env.microsoftClientId,
        clientSecret: env.microsoftClientSecret,
        tenantId: env.microsoftTenantId,
      }),
    );
  }
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
      workerDataSource,
      apiClient,
      emailProviders,
      new PendingEmailTransactionParser(),
      { batchSize: env.emailSync.batchSize },
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
