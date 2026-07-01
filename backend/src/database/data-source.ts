import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { env } from '../config/env';
import { Account } from '../entities/account.entity';
import { AuthIdentity } from '../entities/auth-identity.entity';
import { AuthSession } from '../entities/auth-session.entity';
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
import { CreateInitialSchema1790000000000 } from './migrations/1790000000000-CreateInitialSchema';

export const appDataSource = new DataSource({
  type: 'postgres',
  url: env.databaseUrl,
  ssl: env.dbSsl ? { rejectUnauthorized: false } : false,
  synchronize: env.dbSynchronize,
  logging: env.nodeEnv === 'development',
  entities: [
    User,
    AuthIdentity,
    AuthSession,
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
  migrations: [CreateInitialSchema1790000000000],
});
