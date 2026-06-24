import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAuthSessionsAndNotificationPreferences1780000000006 implements MigrationInterface {
  name = 'AddAuthSessionsAndNotificationPreferences1780000000006';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS auth_sessions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        refresh_token_hash varchar(255) NOT NULL,
        user_agent varchar(500),
        ip_address varchar(80),
        last_used_at timestamptz NOT NULL,
        expires_at timestamptz NOT NULL,
        revoked_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_revoked
        ON auth_sessions(user_id, revoked_at)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_auth_sessions_expires_at
        ON auth_sessions(expires_at)
    `);

    await queryRunner.query(`
      ALTER TABLE user_preferences
        ADD COLUMN IF NOT EXISTS scheduled_payment_reminders boolean NOT NULL DEFAULT true,
        ADD COLUMN IF NOT EXISTS unusual_spending_alerts boolean NOT NULL DEFAULT true
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE user_preferences
        DROP COLUMN IF EXISTS unusual_spending_alerts,
        DROP COLUMN IF EXISTS scheduled_payment_reminders
    `);

    await queryRunner.query('DROP INDEX IF EXISTS idx_auth_sessions_expires_at');
    await queryRunner.query('DROP INDEX IF EXISTS idx_auth_sessions_user_revoked');
    await queryRunner.query('DROP TABLE IF EXISTS auth_sessions');
  }
}
