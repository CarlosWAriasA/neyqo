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

export type CategoryType = 'income' | 'expense';
export type EntityStatus = 'active' | 'inactive';

@Entity({ name: 'categories' })
@Index(['userId', 'type', 'status'])
@Index(['userId', 'name'])
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ type: 'varchar', length: 90 })
  name!: string;

  @Column({ type: 'varchar', length: 20 })
  type!: CategoryType;

  @Column({ type: 'varchar', length: 40 })
  icon!: string;

  @Column({ type: 'varchar', length: 240, nullable: true })
  description!: string | null;

  @Column({ name: 'is_default', type: 'boolean', default: false })
  isDefault!: boolean;

  @Column({ type: 'integer', default: 100 })
  priority!: number;

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status!: EntityStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
