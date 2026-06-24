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
import { ScheduledTransaction } from './scheduled-transaction.entity';
import { User } from './user.entity';

export type TransactionType = 'income' | 'expense' | 'transfer';
export type TransactionStatus = 'completed' | 'pending' | 'cancelled';
export type TransactionSource = 'manual' | 'scheduled_transaction' | 'email_sync' | 'system';

@Entity({ name: 'transactions' })
@Index(['userId', 'date'])
@Index(['userId', 'date', 'createdAt', 'id'])
@Index(['userId', 'type', 'status'])
@Index(['userId', 'status', 'date'])
@Index(['sourceAccountId'])
@Index(['destinationAccountId'])
@Index(['categoryId'])
@Index(['scheduledTransactionId', 'scheduledExecutionDate'], {
  unique: true,
  where: '"scheduled_transaction_id" IS NOT NULL AND "scheduled_execution_date" IS NOT NULL',
})
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ type: 'varchar', length: 20 })
  type!: TransactionType;

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  amount!: string;

  @Column({ type: 'varchar', length: 3 })
  currency!: string;

  @Column({ name: 'destination_amount', type: 'numeric', precision: 14, scale: 2, nullable: true })
  destinationAmount!: string | null;

  @Column({ name: 'destination_currency', type: 'varchar', length: 3, nullable: true })
  destinationCurrency!: string | null;

  @Column({ name: 'exchange_rate', type: 'numeric', precision: 18, scale: 8, nullable: true })
  exchangeRate!: string | null;

  @Column({ name: 'source_account_id', type: 'uuid' })
  sourceAccountId!: string;

  @ManyToOne(() => Account, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'source_account_id' })
  sourceAccount!: Account;

  @Column({ name: 'destination_account_id', type: 'uuid', nullable: true })
  destinationAccountId!: string | null;

  @ManyToOne(() => Account, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'destination_account_id' })
  destinationAccount!: Account | null;

  @Column({ name: 'category_id', type: 'uuid', nullable: true })
  categoryId!: string | null;

  @ManyToOne(() => Category, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'category_id' })
  category!: Category | null;

  @Column({ type: 'varchar', length: 140 })
  description!: string;

  @Column({ type: 'date' })
  date!: string;

  @Column({ type: 'varchar', length: 20, default: 'completed' })
  status!: TransactionStatus;

  @Column({ type: 'varchar', length: 40, default: 'manual' })
  source!: TransactionSource;

  @Column({ name: 'scheduled_transaction_id', type: 'uuid', nullable: true })
  scheduledTransactionId!: string | null;

  @ManyToOne(() => ScheduledTransaction, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'scheduled_transaction_id' })
  scheduledTransaction!: ScheduledTransaction | null;

  @Column({ name: 'scheduled_execution_date', type: 'date', nullable: true })
  scheduledExecutionDate!: string | null;

  @Column({ name: 'processed_at', type: 'timestamptz', nullable: true })
  processedAt!: Date | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  note!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
