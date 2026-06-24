import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAuthThrottleBuckets1780000000002 implements MigrationInterface {
  name = 'AddAuthThrottleBuckets1780000000002';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS pgcrypto');

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS auth_throttle_buckets (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        scope varchar(80) NOT NULL,
        bucket_key varchar(255) NOT NULL,
        attempts integer NOT NULL DEFAULT 0,
        window_started_at timestamptz NOT NULL,
        locked_until timestamptz,
        expires_at timestamptz NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT UQ_auth_throttle_buckets_scope_key UNIQUE(scope, bucket_key)
      )
    `);

    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS IDX_auth_throttle_buckets_expires_at ON auth_throttle_buckets(expires_at)',
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS auth_throttle_buckets');
  }
}
