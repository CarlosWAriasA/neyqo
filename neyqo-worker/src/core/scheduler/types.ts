export interface JobExecutionContext {
  userId?: string;
  triggeredBy: 'scheduler' | 'manual';
}

export interface JobExecutionResult {
  processedCount: number;
  successCount: number;
  failedCount: number;
  status: 'success' | 'partial_success' | 'failed';
  errorMessage?: string;
}

export interface WorkerJob {
  name: string;
  enabled: boolean;
  intervalMs: number;
  execute(context: JobExecutionContext): Promise<JobExecutionResult>;
}
