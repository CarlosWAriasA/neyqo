import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { env } from '../config/env';
import { Account } from '../entities/account.entity';
import { AuthIdentity } from '../entities/auth-identity.entity';
import { Budget } from '../entities/budget.entity';
import { BudgetPeriodRecord } from '../entities/budget-period.entity';
import { Category } from '../entities/category.entity';
import { EmailSyncedMessage } from '../entities/email-synced-message.entity';
import { ScheduledTransaction } from '../entities/scheduled-transaction.entity';
import { Transaction } from '../entities/transaction.entity';
import { UserPreference } from '../entities/user-preference.entity';
import { User } from '../entities/user.entity';
import { WorkerJobError } from '../entities/worker-job-error.entity';
import { WorkerJobRun } from '../entities/worker-job-run.entity';
import { AddWorkerAutomation1780000000000 } from './migrations/1780000000000-AddWorkerAutomation';
import { AddInitialDataNoticeShownToUsers1780000000001 } from './migrations/1780000000001-AddInitialDataNoticeShownToUsers';

export const appDataSource = new DataSource({
  type: 'postgres',
  url: env.databaseUrl,
  ssl: env.dbSsl ? { rejectUnauthorized: false } : false,
  synchronize: env.dbSynchronize,
  logging: env.nodeEnv === 'development',
  entities: [
    User,
    AuthIdentity,
    Account,
    UserPreference,
    Category,
    Transaction,
    Budget,
    BudgetPeriodRecord,
    ScheduledTransaction,
    WorkerJobRun,
    WorkerJobError,
    EmailSyncedMessage,
  ],
  migrations: [AddWorkerAutomation1780000000000, AddInitialDataNoticeShownToUsers1780000000001],
});
