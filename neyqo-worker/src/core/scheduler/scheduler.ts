import { logger } from '../logging/logger';
import type { JobExecutionContext, JobExecutionResult, WorkerJob } from './types';

export class JobScheduler {
  private readonly jobs = new Map<string, WorkerJob>();
  private readonly timers = new Map<string, NodeJS.Timeout>();
  private readonly runningJobs = new Set<string>();
  private acceptingWork = false;

  constructor(jobs: WorkerJob[]) {
    for (const job of jobs) {
      this.jobs.set(job.name, job);
    }
  }

  start(): void {
    this.acceptingWork = true;

    for (const job of this.jobs.values()) {
      if (!job.enabled) {
        logger.info('Worker job desactivado.', { jobName: job.name });
        continue;
      }

      const timer = setInterval(() => {
        void this.runJob(job.name, { triggeredBy: 'scheduler' });
      }, job.intervalMs);

      this.timers.set(job.name, timer);
      void this.runJob(job.name, { triggeredBy: 'scheduler' });
    }
  }

  async stop(): Promise<void> {
    this.acceptingWork = false;

    for (const timer of this.timers.values()) {
      clearInterval(timer);
    }

    this.timers.clear();

    while (this.runningJobs.size > 0) {
      await new Promise((resolve) => {
        setTimeout(resolve, 100);
      });
    }
  }

  async runJob(name: string, context: Omit<JobExecutionContext, 'triggeredBy'> & { triggeredBy?: JobExecutionContext['triggeredBy'] } = {}): Promise<JobExecutionResult> {
    const job = this.jobs.get(name);

    if (!job) {
      throw new Error(`Job no registrado: ${name}`);
    }

    if (!job.enabled) {
      return {
        processedCount: 0,
        successCount: 0,
        failedCount: 0,
        status: 'success',
      };
    }

    if (!this.acceptingWork && context.triggeredBy !== 'manual') {
      return {
        processedCount: 0,
        successCount: 0,
        failedCount: 0,
        status: 'success',
      };
    }

    if (this.runningJobs.has(name)) {
      logger.warn('Se omitió una ejecución porque el job ya está corriendo.', { jobName: name });
      return {
        processedCount: 0,
        successCount: 0,
        failedCount: 0,
        status: 'success',
      };
    }

    this.runningJobs.add(name);

    try {
      return await job.execute({
        userId: context.userId,
        triggeredBy: context.triggeredBy ?? 'manual',
      });
    } catch (error) {
      logger.error('El job falló fuera de su manejo interno.', error, { jobName: name });
      return {
        processedCount: 0,
        successCount: 0,
        failedCount: 1,
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Error desconocido.',
      };
    } finally {
      this.runningJobs.delete(name);
    }
  }

  getRegisteredJobs(): WorkerJob[] {
    return [...this.jobs.values()];
  }
}
