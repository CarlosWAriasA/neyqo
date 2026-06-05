import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export type ScheduledTransactionFrequency = 'weekly' | 'biweekly' | 'monthly' | 'yearly';
export type ScheduledTransactionStatus = 'active' | 'paused' | 'completed' | 'inactive';
export type ScheduledTransactionType = 'income' | 'expense';

@Entity({ name: 'scheduled_transactions' })
@Index(['userId', 'status', 'nextExecutionDate'])
@Index(['lockedUntil'])
export class ScheduledTransaction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ type: 'varchar', length: 20 })
  type!: ScheduledTransactionType;

  @Column({ type: 'varchar', length: 120 })
  name!: string;

  @Column({ type: 'varchar', length: 140 })
  description!: string;

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  amount!: string;

  @Column({ name: 'source_account_id', type: 'uuid' })
  sourceAccountId!: string;

  @Column({ name: 'category_id', type: 'uuid' })
  categoryId!: string;

  @Column({ type: 'varchar', length: 20 })
  frequency!: ScheduledTransactionFrequency;

  @Column({ name: 'day_of_week', type: 'integer', nullable: true })
  dayOfWeek!: number | null;

  @Column({ name: 'days_of_month', type: 'jsonb', nullable: true })
  daysOfMonth!: number[] | null;

  @Column({ name: 'month_of_year', type: 'integer', nullable: true })
  monthOfYear!: number | null;

  @Column({ name: 'start_date', type: 'date' })
  startDate!: string;

  @Column({ name: 'end_date', type: 'date', nullable: true })
  endDate!: string | null;

  @Column({ name: 'next_execution_date', type: 'date' })
  nextExecutionDate!: string;

  @Column({ name: 'last_execution_date', type: 'date', nullable: true })
  lastExecutionDate!: string | null;

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status!: ScheduledTransactionStatus;

  @Column({ name: 'locked_by', type: 'varchar', length: 120, nullable: true })
  lockedBy!: string | null;

  @Column({ name: 'locked_until', type: 'timestamptz', nullable: true })
  lockedUntil!: Date | null;

  @Column({ name: 'last_error', type: 'varchar', length: 500, nullable: true })
  lastError!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
