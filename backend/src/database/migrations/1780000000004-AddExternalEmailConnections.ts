import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddExternalEmailConnections1780000000004 implements MigrationInterface {
  name = 'AddExternalEmailConnections1780000000004';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS external_connections (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        provider varchar(20) NOT NULL,
        email varchar(190) NOT NULL,
        status varchar(30) NOT NULL DEFAULT 'connected',
        scopes text NOT NULL,
        encrypted_access_token text NOT NULL,
        encrypted_refresh_token text,
        token_expires_at timestamptz,
        last_sync_at timestamptz,
        revoked_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT UQ_external_connections_user_provider UNIQUE(user_id, provider)
      )
    `);
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS IDX_external_connections_status_provider ON external_connections(status, provider)',
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS external_connections');
  }
}
