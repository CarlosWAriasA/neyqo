import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Budget, type BudgetPeriod } from './budget.entity';
import { User } from './user.entity';

export type BudgetPeriodStatus = 'active' | 'closed';

@Entity({ name: 'budget_periods' })
@Index(['budgetId', 'startDate', 'endDate'], { unique: true })
@Index(['userId', 'startDate', 'endDate'])
export class BudgetPeriodRecord {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'budget_id', type: 'uuid' })
  budgetId!: string;

  @ManyToOne(() => Budget, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'budget_id' })
  budget!: Budget;

  @Column({ type: 'varchar', length: 20 })
  period!: BudgetPeriod;

  @Column({ name: 'start_date', type: 'date' })
  startDate!: string;

  @Column({ name: 'end_date', type: 'date' })
  endDate!: string;

  @Column({ name: 'budgeted_amount', type: 'numeric', precision: 14, scale: 2 })
  budgetedAmount!: string;

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status!: BudgetPeriodStatus;

  @Column({ name: 'closed_at', type: 'timestamptz', nullable: true })
  closedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
