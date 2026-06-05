import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AuthIdentity } from './auth-identity.entity';

export type AuthProvider = 'email' | 'google' | 'microsoft';

@Entity({ name: 'users' })
@Index(['email'], { unique: true })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'full_name', type: 'varchar', length: 120 })
  fullName!: string;

  @Column({ type: 'varchar', length: 190 })
  email!: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 255, nullable: true, select: false })
  passwordHash!: string | null;

  @OneToMany(() => AuthIdentity, (authIdentity) => authIdentity.user)
  authIdentities!: AuthIdentity[];

  @Column({ name: 'email_verified', type: 'boolean', default: false })
  emailVerified!: boolean;

  @Column({ name: 'avatar_url', type: 'varchar', length: 500, nullable: true })
  avatarUrl!: string | null;

  @Column({
    name: 'email_verification_code_hash',
    type: 'varchar',
    length: 255,
    nullable: true,
    select: false,
  })
  emailVerificationCodeHash!: string | null;

  @Column({ name: 'email_verification_code_expires_at', type: 'timestamptz', nullable: true })
  emailVerificationCodeExpiresAt!: Date | null;

  @Column({
    name: 'password_reset_code_hash',
    type: 'varchar',
    length: 255,
    nullable: true,
    select: false,
  })
  passwordResetCodeHash!: string | null;

  @Column({ name: 'password_reset_code_expires_at', type: 'timestamptz', nullable: true })
  passwordResetCodeExpiresAt!: Date | null;

  @Column({
    name: 'refresh_token_hash',
    type: 'varchar',
    length: 255,
    nullable: true,
    select: false,
  })
  refreshTokenHash!: string | null;

  @Column({ name: 'refresh_token_expires_at', type: 'timestamptz', nullable: true })
  refreshTokenExpiresAt!: Date | null;

  @Column({ name: 'last_login_at', type: 'timestamptz', nullable: true })
  lastLoginAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
