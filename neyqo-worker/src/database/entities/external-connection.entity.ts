import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export type ExternalConnectionProvider = 'gmail' | 'outlook';
export type ExternalConnectionStatus = 'connected' | 'disconnected' | 'preparing' | 'error';

@Entity({ name: 'external_connections' })
@Index(['userId', 'provider'], { unique: true })
@Index(['status', 'provider'])
export class ExternalConnection {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ type: 'varchar', length: 20 })
  provider!: ExternalConnectionProvider;

  @Column({ type: 'varchar', length: 190 })
  email!: string;

  @Column({ type: 'varchar', length: 30, default: 'connected' })
  status!: ExternalConnectionStatus;

  @Column({ type: 'simple-array' })
  scopes!: string[];

  @Column({ name: 'encrypted_access_token', type: 'text' })
  encryptedAccessToken!: string;

  @Column({ name: 'encrypted_refresh_token', type: 'text', nullable: true })
  encryptedRefreshToken!: string | null;

  @Column({ name: 'token_expires_at', type: 'timestamptz', nullable: true })
  tokenExpiresAt!: Date | null;

  @Column({ name: 'last_sync_at', type: 'timestamptz', nullable: true })
  lastSyncAt!: Date | null;

  @Column({ name: 'revoked_at', type: 'timestamptz', nullable: true })
  revokedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
