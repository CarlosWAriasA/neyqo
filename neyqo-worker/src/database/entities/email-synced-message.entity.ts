import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'email_synced_messages' })
@Index(['userId', 'provider', 'externalMessageId'], { unique: true })
export class EmailSyncedMessage {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ type: 'varchar', length: 20 })
  provider!: 'gmail' | 'outlook';

  @Column({ name: 'external_message_id', type: 'varchar', length: 255 })
  externalMessageId!: string;

  @Column({ type: 'varchar', length: 30, default: 'processed' })
  status!: 'processed' | 'ignored' | 'failed';

  @Column({ name: 'transaction_id', type: 'uuid', nullable: true })
  transactionId!: string | null;

  @Column({ name: 'processed_at', type: 'timestamptz', nullable: true })
  processedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
