import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Category } from './category.entity';
import { User } from './user.entity';

export type BudgetStatus = 'active' | 'inactive';
export type BudgetPeriod = 'weekly' | 'biweekly' | 'monthly';

@Entity({ name: 'budgets' })
@Index(['userId', 'month', 'year'])
@Index(['userId', 'status'])
export class Budget {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ type: 'varchar', length: 90 })
  name!: string;

  @Column({ name: 'max_amount', type: 'numeric', precision: 14, scale: 2 })
  maxAmount!: string;

  @Column({ type: 'integer' })
  month!: number;

  @Column({ type: 'integer' })
  year!: number;

  @Column({ type: 'varchar', length: 20, default: 'monthly' })
  period!: BudgetPeriod;

  @Column({ name: 'start_date', type: 'date', default: () => 'CURRENT_DATE' })
  startDate!: string;

  @Column({ name: 'reset_day_of_month', type: 'integer', nullable: true })
  resetDayOfMonth!: number | null;

  @Column({ name: 'reset_day_of_week', type: 'integer', nullable: true })
  resetDayOfWeek!: number | null;

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status!: BudgetStatus;

  @Column({ type: 'varchar', length: 240, nullable: true })
  description!: string | null;

  @ManyToMany(() => Category)
  @JoinTable({
    name: 'budget_categories',
    joinColumn: {
      name: 'budget_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'category_id',
      referencedColumnName: 'id',
    },
  })
  categories!: Category[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
