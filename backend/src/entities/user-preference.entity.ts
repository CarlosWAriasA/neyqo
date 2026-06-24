import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

export type CurrencyCode = 'DOP' | 'USD' | 'EUR';
export type DateFormatPreference = 'dd-mm-yyyy' | 'yyyy-mm-dd';
export type WeekStartPreference = 'monday' | 'sunday';
export type ThemePreference = 'light' | 'dark' | 'system';

@Entity({ name: 'user_preferences' })
@Index(['userId'], { unique: true })
export class UserPreference {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'primary_currency', type: 'varchar', length: 3, default: 'DOP' })
  primaryCurrency!: CurrencyCode;

  @Column({ name: 'date_format', type: 'varchar', length: 20, default: 'dd-mm-yyyy' })
  dateFormat!: DateFormatPreference;

  @Column({ name: 'week_starts_on', type: 'varchar', length: 10, default: 'monday' })
  weekStartsOn!: WeekStartPreference;

  @Column({ type: 'varchar', length: 10, default: 'system' })
  theme!: ThemePreference;

  @Column({ name: 'hide_balances', type: 'boolean', default: false })
  hideBalances!: boolean;

  @Column({ name: 'budget_alerts', type: 'boolean', default: true })
  budgetAlerts!: boolean;

  @Column({ name: 'scheduled_payment_reminders', type: 'boolean', default: true })
  scheduledPaymentReminders!: boolean;

  @Column({ name: 'unusual_spending_alerts', type: 'boolean', default: true })
  unusualSpendingAlerts!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
