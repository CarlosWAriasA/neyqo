import type { ScheduledTransaction } from '../../database/entities/scheduled-transaction.entity';

export type ScheduledTransactionRecord = ScheduledTransaction;

export interface ScheduledTransactionsJobOptions {
  batchSize: number;
  maxCatchUpPerRecord: number;
  lockTtlMs: number;
  workerInstanceId: string;
  retry: {
    maxRetries: number;
    retryDelayMs: number;
  };
}
