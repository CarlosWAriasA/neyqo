import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { env } from '../config/env';
import { Account } from '../entities/account.entity';
import { AuthIdentity } from '../entities/auth-identity.entity';
import { AuthThrottleBucket } from '../entities/auth-throttle-bucket.entity';
import { Budget } from '../entities/budget.entity';
import { BudgetPeriodRecord } from '../entities/budget-period.entity';
import { Category } from '../entities/category.entity';
import { EmailImportRule } from '../entities/email-import-rule.entity';
import { EmailSyncedMessage } from '../entities/email-synced-message.entity';
import { ExternalConnection } from '../entities/external-connection.entity';
import { ImportedTransaction } from '../entities/imported-transaction.entity';
import { ScheduledTransaction } from '../entities/scheduled-transaction.entity';
import { Transaction } from '../entities/transaction.entity';
import { UserPreference } from '../entities/user-preference.entity';
import { User } from '../entities/user.entity';
import { WorkerJobError } from '../entities/worker-job-error.entity';
import { WorkerJobRun } from '../entities/worker-job-run.entity';
import { AddWorkerAutomation1780000000000 } from './migrations/1780000000000-AddWorkerAutomation';
import { AddInitialDataNoticeShownToUsers1780000000001 } from './migrations/1780000000001-AddInitialDataNoticeShownToUsers';
import { AddAuthThrottleBuckets1780000000002 } from './migrations/1780000000002-AddAuthThrottleBuckets';
import { AddEmailSyncImportReview1780000000003 } from './migrations/1780000000003-AddEmailSyncImportReview';
import { AddExternalEmailConnections1780000000004 } from './migrations/1780000000004-AddExternalEmailConnections';
import { AddMultiCurrencyTransfers1780000000005 } from './migrations/1780000000005-AddMultiCurrencyTransfers';

export const appDataSource = new DataSource({
  type: 'postgres',
  url: env.databaseUrl,
  ssl: env.dbSsl ? { rejectUnauthorized: false } : false,
  synchronize: env.dbSynchronize,
  logging: env.nodeEnv === 'development',
  entities: [
    User,
    AuthIdentity,
    AuthThrottleBucket,
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
    ExternalConnection,
    EmailImportRule,
    ImportedTransaction,
  ],
  migrations: [
    AddWorkerAutomation1780000000000,
    AddInitialDataNoticeShownToUsers1780000000001,
    AddAuthThrottleBuckets1780000000002,
    AddEmailSyncImportReview1780000000003,
    AddExternalEmailConnections1780000000004,
    AddMultiCurrencyTransfers1780000000005,
  ],
});
