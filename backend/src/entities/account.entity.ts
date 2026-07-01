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
import { User } from './user.entity';

export type AccountType = 'cash' | 'bank' | 'debit_card' | 'credit_card' | 'wallet' | 'other';
export type CurrencyCode = 'DOP' | 'USD' | 'EUR';
export type EntityStatus = 'active' | 'inactive';

@Entity({ name: 'accounts' })
@Index(['userId', 'status'])
@Index(['userId', 'name'])
@Index('idx_accounts_user_currency_status', ['userId', 'currency', 'status'])
export class Account {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ type: 'varchar', length: 90 })
  name!: string;

  @Column({ type: 'varchar', length: 30 })
  type!: AccountType;

  @Column({ type: 'varchar', length: 3 })
  currency!: CurrencyCode;

  @Column({ name: 'institution_name', type: 'varchar', length: 90, nullable: true })
  institutionName!: string | null;

  @Column({ name: 'last_four', type: 'varchar', length: 4, nullable: true })
  lastFour!: string | null;

  @Column({ name: 'initial_balance', type: 'numeric', precision: 14, scale: 2, default: 0 })
  initialBalance!: string;

  @Column({ name: 'current_balance', type: 'numeric', precision: 14, scale: 2, default: 0 })
  currentBalance!: string;

  @Column({ type: 'varchar', length: 240, nullable: true })
  description!: string | null;

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status!: EntityStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
