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
import { User } from './user.entity';

export type EmailImportBankCode =
  | 'popular'
  | 'qik'
  | 'santa_cruz'
  | 'banesco'
  | 'asociacion_popular'
  | 'lafise'
  | 'bhd'
  | 'banreservas'
  | 'bdi'
  | 'unknown';
export type EmailImportRuleStatus = 'active' | 'inactive';
export type EmailImportProductKind = 'card' | 'account' | 'unknown';

@Entity({ name: 'email_import_rules' })
@Index(['userId', 'bankCode', 'status'])
@Index(['userId', 'bankCode', 'cardLastDigits'])
export class EmailImportRule {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'bank_code', type: 'varchar', length: 40 })
  bankCode!: EmailImportBankCode;

  @Column({ name: 'account_id', type: 'uuid' })
  accountId!: string;

  @ManyToOne(() => Account, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'account_id' })
  account!: Account;

  @Column({ name: 'category_id', type: 'uuid' })
  categoryId!: string;

  @ManyToOne(() => Category, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'category_id' })
  category!: Category;

  @Column({ name: 'product_kind', type: 'varchar', length: 20, default: 'card' })
  productKind!: EmailImportProductKind;

  @Column({ name: 'card_last_digits', type: 'varchar', length: 4, nullable: true })
  cardLastDigits!: string | null;

  @Column({ name: 'merchant_pattern', type: 'varchar', length: 120, nullable: true })
  merchantPattern!: string | null;

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status!: EmailImportRuleStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
