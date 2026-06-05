import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWorkerAutomation1780000000000 implements MigrationInterface {
  name = 'AddWorkerAutomation1780000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS pgcrypto');

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS scheduled_transactions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type varchar(20) NOT NULL,
        name varchar(120) NOT NULL,
        description varchar(140) NOT NULL,
        amount numeric(14, 2) NOT NULL,
        source_account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
        category_id uuid NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
        frequency varchar(20) NOT NULL,
        day_of_week integer,
        days_of_month jsonb,
        month_of_year integer,
        start_date date NOT NULL,
        end_date date,
        next_execution_date date NOT NULL,
        last_execution_date date,
        status varchar(20) NOT NULL DEFAULT 'active',
        locked_by varchar(120),
        locked_until timestamptz,
        last_error varchar(500),
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS IDX_scheduled_transactions_due ON scheduled_transactions(user_id, status, next_execution_date)',
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS IDX_scheduled_transactions_locked_until ON scheduled_transactions(locked_until)',
    );

    await queryRunner.query(`
      ALTER TABLE transactions
        ADD COLUMN IF NOT EXISTS source varchar(40) NOT NULL DEFAULT 'manual',
        ADD COLUMN IF NOT EXISTS scheduled_transaction_id uuid REFERENCES scheduled_transactions(id) ON DELETE SET NULL,
        ADD COLUMN IF NOT EXISTS scheduled_execution_date date,
        ADD COLUMN IF NOT EXISTS processed_at timestamptz
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS IDX_transactions_scheduled_execution_unique
        ON transactions(scheduled_transaction_id, scheduled_execution_date)
        WHERE scheduled_transaction_id IS NOT NULL AND scheduled_execution_date IS NOT NULL
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS worker_job_runs (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        job_name varchar(120) NOT NULL,
        worker_instance_id varchar(120) NOT NULL,
        started_at timestamptz NOT NULL,
        finished_at timestamptz,
        status varchar(30) NOT NULL,
        processed_count integer NOT NULL DEFAULT 0,
        success_count integer NOT NULL DEFAULT 0,
        failed_count integer NOT NULL DEFAULT 0,
        error_message varchar(1000),
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query('CREATE INDEX IF NOT EXISTS IDX_worker_job_runs_job_started ON worker_job_runs(job_name, started_at)');

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS worker_job_errors (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        job_run_id uuid NOT NULL REFERENCES worker_job_runs(id) ON DELETE CASCADE,
        job_name varchar(120) NOT NULL,
        entity_type varchar(120) NOT NULL,
        entity_id varchar(120) NOT NULL,
        attempt integer NOT NULL DEFAULT 1,
        error_message varchar(1000) NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query('CREATE INDEX IF NOT EXISTS IDX_worker_job_errors_job_created ON worker_job_errors(job_name, created_at)');
    await queryRunner.query('CREATE INDEX IF NOT EXISTS IDX_worker_job_errors_entity ON worker_job_errors(entity_type, entity_id)');

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS email_synced_messages (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL,
        provider varchar(20) NOT NULL,
        external_message_id varchar(255) NOT NULL,
        status varchar(30) NOT NULL DEFAULT 'processed',
        transaction_id uuid,
        processed_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT UQ_email_synced_messages_user_provider_message UNIQUE(user_id, provider, external_message_id)
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS email_synced_messages');
    await queryRunner.query('DROP TABLE IF EXISTS worker_job_errors');
    await queryRunner.query('DROP TABLE IF EXISTS worker_job_runs');
    await queryRunner.query('DROP INDEX IF EXISTS IDX_transactions_scheduled_execution_unique');
    await queryRunner.query(`
      ALTER TABLE transactions
        DROP COLUMN IF EXISTS processed_at,
        DROP COLUMN IF EXISTS scheduled_execution_date,
        DROP COLUMN IF EXISTS scheduled_transaction_id,
        DROP COLUMN IF EXISTS source
    `);
    await queryRunner.query('DROP TABLE IF EXISTS scheduled_transactions');
  }
}
