import type { JobExecutionContext, JobExecutionResult, WorkerJob } from '../../core/scheduler/types';
import type { EmailProvider, EmailTransactionParser } from './types';

export class EmailSyncJob implements WorkerJob {
  readonly name = 'email-sync';

  constructor(
    readonly enabled: boolean,
    readonly intervalMs: number,
    private readonly providers: EmailProvider[],
    private readonly parser: EmailTransactionParser,
  ) {}

  async execute(_context: JobExecutionContext): Promise<JobExecutionResult> {
    void this.providers;
    void this.parser;

    return {
      processedCount: 0,
      successCount: 0,
      failedCount: 0,
      status: 'success',
    };
  }
}
