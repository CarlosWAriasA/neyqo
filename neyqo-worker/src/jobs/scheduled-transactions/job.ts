import type { JobExecutionContext, JobExecutionResult, WorkerJob } from '../../core/scheduler/types';
import type { ScheduledTransactionsService } from './service';

export class ScheduledTransactionsJob implements WorkerJob {
  readonly name = 'scheduled-transactions';

  constructor(
    readonly enabled: boolean,
    readonly intervalMs: number,
    private readonly service: ScheduledTransactionsService,
  ) {}

  execute(context: JobExecutionContext): Promise<JobExecutionResult> {
    return this.service.execute(context, this.name);
  }
}
