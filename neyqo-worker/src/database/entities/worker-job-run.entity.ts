import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export type WorkerJobRunStatus = 'running' | 'success' | 'partial_success' | 'failed';

@Entity({ name: 'worker_job_runs' })
@Index(['jobName', 'startedAt'])
export class WorkerJobRun {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'job_name', type: 'varchar', length: 120 })
  jobName!: string;

  @Column({ name: 'worker_instance_id', type: 'varchar', length: 120 })
  workerInstanceId!: string;

  @Column({ name: 'started_at', type: 'timestamptz' })
  startedAt!: Date;

  @Column({ name: 'finished_at', type: 'timestamptz', nullable: true })
  finishedAt!: Date | null;

  @Column({ type: 'varchar', length: 30 })
  status!: WorkerJobRunStatus;

  @Column({ name: 'processed_count', type: 'integer', default: 0 })
  processedCount!: number;

  @Column({ name: 'success_count', type: 'integer', default: 0 })
  successCount!: number;

  @Column({ name: 'failed_count', type: 'integer', default: 0 })
  failedCount!: number;

  @Column({ name: 'error_message', type: 'varchar', length: 1000, nullable: true })
  errorMessage!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
