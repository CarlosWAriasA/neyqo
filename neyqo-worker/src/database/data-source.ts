import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { env } from '../config/env';
import { EmailSyncedMessage } from './entities/email-synced-message.entity';
import { ExternalConnection } from './entities/external-connection.entity';
import { ScheduledTransaction } from './entities/scheduled-transaction.entity';
import { WorkerJobError } from './entities/worker-job-error.entity';
import { WorkerJobRun } from './entities/worker-job-run.entity';

export const workerDataSource = new DataSource({
  type: 'postgres',
  url: env.databaseUrl,
  ssl: env.dbSsl ? { rejectUnauthorized: false } : false,
  synchronize: false,
  logging: env.nodeEnv === 'development',
  entities: [ScheduledTransaction, WorkerJobRun, WorkerJobError, EmailSyncedMessage, ExternalConnection],
});
