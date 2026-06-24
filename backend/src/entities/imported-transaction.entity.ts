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
import { EmailImportBankCode } from './email-import-rule.entity';
import { EmailSyncProvider } from './email-synced-message.entity';
import { Transaction } from './transaction.entity';
import { User } from './user.entity';

export type ImportedTransactionEventType =
  | 'purchase'
  | 'reversal'
  | 'payment'
  | 'withdrawal'
  | 'deposit'
  | 'transfer'
  | 'unknown';
export type ImportedTransactionStatus =
  | 'ready_for_review'
  | 'needs_review'
  | 'ignored'
  | 'imported'
  | 'failed';
export type ImportedTransactionProviderStatus = 'approved' | 'declined' | 'pending' | 'unknown';

@Entity({ name: 'imported_transactions' })
@Index(['userId', 'status', 'transactionDate'])
@Index(['userId', 'bankCode', 'cardLastDigits'])
@Index(['userId', 'provider', 'externalMessageId'], { unique: true })
export class ImportedTransaction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ type: 'varchar', length: 20 })
  provider!: EmailSyncProvider;

  @Column({ name: 'external_message_id', type: 'varchar', length: 255 })
  externalMessageId!: string;

  @Column({ name: 'bank_code', type: 'varchar', length: 40 })
  bankCode!: EmailImportBankCode;

  @Column({ name: 'event_type', type: 'varchar', length: 30 })
  eventType!: ImportedTransactionEventType;

  @Column({ name: 'provider_status', type: 'varchar', length: 30, default: 'unknown' })
  providerStatus!: ImportedTransactionProviderStatus;

  @Column({ name: 'product_name', type: 'varchar', length: 120, nullable: true })
  productName!: string | null;

  @Column({ name: 'card_last_digits', type: 'varchar', length: 4, nullable: true })
  cardLastDigits!: string | null;

  @Column({ type: 'varchar', length: 140 })
  merchant!: string;

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  amount!: string;

  @Column({ type: 'varchar', length: 3 })
  currency!: 'DOP' | 'USD' | 'EUR';

  @Column({ name: 'transaction_date', type: 'date' })
  transactionDate!: string;

  @Column({ name: 'account_id', type: 'uuid', nullable: true })
  accountId!: string | null;

  @ManyToOne(() => Account, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'account_id' })
  account!: Account | null;

  @Column({ name: 'category_id', type: 'uuid', nullable: true })
  categoryId!: string | null;

  @ManyToOne(() => Category, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'category_id' })
  category!: Category | null;

  @Column({ type: 'numeric', precision: 4, scale: 3, default: 0 })
  confidence!: string;

  @Column({ name: 'raw_description', type: 'varchar', length: 1000 })
  rawDescription!: string;

  @Column({ type: 'varchar', length: 30, default: 'needs_review' })
  status!: ImportedTransactionStatus;

  @Column({ name: 'review_note', type: 'varchar', length: 500, nullable: true })
  reviewNote!: string | null;

  @Column({ name: 'transaction_id', type: 'uuid', nullable: true })
  transactionId!: string | null;

  @ManyToOne(() => Transaction, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'transaction_id' })
  transaction!: Transaction | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
