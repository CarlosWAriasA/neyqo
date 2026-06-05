import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Account } from './account.entity';
import { Category } from './category.entity';
import type { TransactionType } from './transaction.entity';
import { User } from './user.entity';

export type ScheduledTransactionFrequency = 'weekly' | 'biweekly' | 'monthly' | 'yearly';
export type ScheduledTransactionStatus = 'active' | 'paused' | 'completed' | 'inactive';

@Entity({ name: 'scheduled_transactions' })
@Index(['userId', 'status', 'nextExecutionDate'])
@Index(['lockedUntil'])
export class ScheduledTransaction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ type: 'varchar', length: 20 })
  type!: Extract<TransactionType, 'income' | 'expense'>;

  @Column({ type: 'varchar', length: 120 })
  name!: string;

  @Column({ type: 'varchar', length: 140 })
  description!: string;

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  amount!: string;

  @Column({ name: 'source_account_id', type: 'uuid' })
  sourceAccountId!: string;

  @ManyToOne(() => Account, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'source_account_id' })
  sourceAccount!: Account;

  @Column({ name: 'category_id', type: 'uuid' })
  categoryId!: string;

  @ManyToOne(() => Category, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'category_id' })
  category!: Category;

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
