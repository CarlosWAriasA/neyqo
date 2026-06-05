import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { WorkerJobRun } from './worker-job-run.entity';

@Entity({ name: 'worker_job_errors' })
@Index(['jobName', 'createdAt'])
@Index(['entityType', 'entityId'])
export class WorkerJobError {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'job_run_id', type: 'uuid' })
  jobRunId!: string;

  @ManyToOne(() => WorkerJobRun, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'job_run_id' })
  jobRun!: WorkerJobRun;

  @Column({ name: 'job_name', type: 'varchar', length: 120 })
  jobName!: string;

  @Column({ name: 'entity_type', type: 'varchar', length: 120 })
  entityType!: string;

  @Column({ name: 'entity_id', type: 'varchar', length: 120 })
  entityId!: string;

  @Column({ type: 'integer', default: 1 })
  attempt!: number;

  @Column({ name: 'error_message', type: 'varchar', length: 1000 })
  errorMessage!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
