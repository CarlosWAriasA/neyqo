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
import type { AuthProvider } from './user.entity';
import { User } from './user.entity';

@Entity({ name: 'auth_identities' })
@Index(['provider', 'providerUserId'], { unique: true })
@Index(['userId', 'provider'], { unique: true })
export class AuthIdentity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ type: 'varchar', length: 20 })
  provider!: AuthProvider;

  @Column({ name: 'provider_user_id', type: 'varchar', length: 255 })
  providerUserId!: string;

  @Column({ name: 'provider_email', type: 'varchar', length: 190, nullable: true })
  providerEmail!: string | null;

  @ManyToOne(() => User, (user) => user.authIdentities, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
