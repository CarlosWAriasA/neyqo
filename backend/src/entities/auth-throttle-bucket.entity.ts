import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'auth_throttle_buckets' })
@Index(['scope', 'bucketKey'], { unique: true })
@Index(['expiresAt'])
export class AuthThrottleBucket {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 80 })
  scope!: string;

  @Column({ name: 'bucket_key', type: 'varchar', length: 255 })
  bucketKey!: string;

  @Column({ type: 'integer', default: 0 })
  attempts!: number;

  @Column({ name: 'window_started_at', type: 'timestamptz' })
  windowStartedAt!: Date;

  @Column({ name: 'locked_until', type: 'timestamptz', nullable: true })
  lockedUntil!: Date | null;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt!: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
