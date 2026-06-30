import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAuthSessionDeviceId1780000000008 implements MigrationInterface {
  name = 'AddAuthSessionDeviceId1780000000008';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE auth_sessions
        ADD COLUMN IF NOT EXISTS device_id uuid
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_auth_sessions_user_device_active
        ON auth_sessions(user_id, device_id)
        WHERE revoked_at IS NULL AND device_id IS NOT NULL
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS idx_auth_sessions_user_device_active');
    await queryRunner.query(`
      ALTER TABLE auth_sessions
        DROP COLUMN IF EXISTS device_id
    `);
  }
}
