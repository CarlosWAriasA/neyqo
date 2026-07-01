import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Production baseline for a brand-new Neyqo database.
 *
 * Older migrations in this directory were written after the development
 * database had already been created with TypeORM synchronize. They therefore
 * cannot bootstrap an empty database. This migration captures the complete
 * schema and is the only migration registered for a fresh production rollout.
 */
export class CreateInitialSchema1790000000000 implements MigrationInterface {
  name = 'CreateInitialSchema1790000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS pgcrypto');

    await queryRunner.query(`
      CREATE TABLE users (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        full_name varchar(120) NOT NULL,
        email varchar(190) NOT NULL,
        password_hash varchar(255),
        email_verified boolean NOT NULL DEFAULT false,
        avatar_url varchar(500),
        initial_data_notice_shown boolean NOT NULL DEFAULT false,
        email_verification_code_hash varchar(255),
        email_verification_code_expires_at timestamptz,
        password_reset_code_hash varchar(255),
        password_reset_code_expires_at timestamptz,
        refresh_token_hash varchar(255),
        refresh_token_expires_at timestamptz,
        last_login_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query('CREATE UNIQUE INDEX "IDX_97672ac88f789774dd47f7c8be" ON users(email)');

    await queryRunner.query(`
      CREATE TABLE auth_identities (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL CONSTRAINT "FK_c06a980d83c42611d27a294e55c" REFERENCES users(id) ON DELETE CASCADE,
        provider varchar(20) NOT NULL,
        provider_user_id varchar(255) NOT NULL,
        provider_email varchar(190),
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query('CREATE UNIQUE INDEX "IDX_aa609852756e5772a11b73f8d8" ON auth_identities(provider, provider_user_id)');
    await queryRunner.query('CREATE UNIQUE INDEX "IDX_f4e2d640d6834cbc3a473b897f" ON auth_identities(user_id, provider)');

    await queryRunner.query(`
      CREATE TABLE auth_sessions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL CONSTRAINT "FK_50ccaa6440288a06f0ba693ccc6" REFERENCES users(id) ON DELETE CASCADE,
        refresh_token_hash varchar(255) NOT NULL,
        user_agent varchar(500),
        ip_address varchar(80),
        device_id uuid,
        last_used_at timestamptz NOT NULL,
        expires_at timestamptz NOT NULL,
        revoked_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query('CREATE INDEX "IDX_e7c8a48e71aab039b28055f4b9" ON auth_sessions(user_id, revoked_at)');
    await queryRunner.query('CREATE INDEX "IDX_a4a11809dcf8cdd5fcceec774e" ON auth_sessions(expires_at)');
    await queryRunner.query(`
      CREATE UNIQUE INDEX idx_auth_sessions_user_device_active
        ON auth_sessions(user_id, device_id)
        WHERE revoked_at IS NULL AND device_id IS NOT NULL
    `);

    await queryRunner.query(`
      CREATE TABLE auth_throttle_buckets (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        scope varchar(80) NOT NULL,
        bucket_key varchar(255) NOT NULL,
        attempts integer NOT NULL DEFAULT 0,
        window_started_at timestamptz NOT NULL,
        locked_until timestamptz,
        expires_at timestamptz NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query('CREATE UNIQUE INDEX "IDX_d01d81b79f95767cb8481c797b" ON auth_throttle_buckets(scope, bucket_key)');
    await queryRunner.query('CREATE INDEX "IDX_32616c80d452b57929add1a3b6" ON auth_throttle_buckets(expires_at)');

    await queryRunner.query(`
      CREATE TABLE accounts (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL CONSTRAINT "FK_3000dad1da61b29953f07476324" REFERENCES users(id) ON DELETE CASCADE,
        name varchar(90) NOT NULL,
        type varchar(30) NOT NULL,
        currency varchar(3) NOT NULL,
        institution_name varchar(90),
        last_four varchar(4),
        initial_balance numeric(14, 2) NOT NULL DEFAULT 0,
        current_balance numeric(14, 2) NOT NULL DEFAULT 0,
        description varchar(240),
        status varchar(20) NOT NULL DEFAULT 'active',
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query('CREATE INDEX "IDX_63b84943ca36524b4fc896427e" ON accounts(user_id, status)');
    await queryRunner.query('CREATE INDEX "IDX_b5b3b2f82aa6da1a5104cf3835" ON accounts(user_id, name)');
    await queryRunner.query('CREATE INDEX idx_accounts_user_currency_status ON accounts(user_id, currency, status)');

    await queryRunner.query(`
      CREATE TABLE user_preferences (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL CONSTRAINT "FK_458057fa75b66e68a275647da2e" REFERENCES users(id) ON DELETE CASCADE,
        primary_currency varchar(3) NOT NULL DEFAULT 'DOP',
        date_format varchar(20) NOT NULL DEFAULT 'dd-mm-yyyy',
        week_starts_on varchar(10) NOT NULL DEFAULT 'monday',
        theme varchar(10) NOT NULL DEFAULT 'system',
        hide_balances boolean NOT NULL DEFAULT false,
        budget_alerts boolean NOT NULL DEFAULT true,
        scheduled_payment_reminders boolean NOT NULL DEFAULT true,
        unusual_spending_alerts boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "REL_458057fa75b66e68a275647da2" UNIQUE (user_id)
      )
    `);
    await queryRunner.query('CREATE UNIQUE INDEX "IDX_458057fa75b66e68a275647da2" ON user_preferences(user_id)');

    await queryRunner.query(`
      CREATE TABLE categories (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL CONSTRAINT "FK_2296b7fe012d95646fa41921c8b" REFERENCES users(id) ON DELETE CASCADE,
        name varchar(90) NOT NULL,
        type varchar(20) NOT NULL,
        icon varchar(40) NOT NULL,
        description varchar(240),
        is_default boolean NOT NULL DEFAULT false,
        priority integer NOT NULL DEFAULT 100,
        status varchar(20) NOT NULL DEFAULT 'active',
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query('CREATE INDEX "IDX_b2196ac896935253131f54303d" ON categories(user_id, type, status)');
    await queryRunner.query('CREATE INDEX "IDX_48f0690983e955b500b4a3e029" ON categories(user_id, name)');

    await queryRunner.query(`
      CREATE TABLE budgets (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL CONSTRAINT "FK_5d25d8bbd6c209261dfe04558f1" REFERENCES users(id) ON DELETE CASCADE,
        name varchar(90) NOT NULL,
        max_amount numeric(14, 2) NOT NULL,
        month integer NOT NULL,
        year integer NOT NULL,
        period varchar(20) NOT NULL DEFAULT 'monthly',
        start_date date NOT NULL DEFAULT ('now'::text)::date,
        reset_day_of_month integer,
        reset_day_of_week integer,
        status varchar(20) NOT NULL DEFAULT 'active',
        description varchar(240),
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query('CREATE INDEX "IDX_c0c45c679cb723c1ffff48a139" ON budgets(user_id, month, year)');
    await queryRunner.query('CREATE INDEX "IDX_c3089a0f377fcb57506118dd20" ON budgets(user_id, status)');
    await queryRunner.query('CREATE INDEX "IDX_a1b6dc0278ef27fc589222f4cf" ON budgets(user_id, status, created_at, id)');

    await queryRunner.query(`
      CREATE TABLE budget_categories (
        budget_id uuid NOT NULL CONSTRAINT "FK_919faa73fd59efb0f80ccc36079" REFERENCES budgets(id) ON DELETE CASCADE ON UPDATE CASCADE,
        category_id uuid NOT NULL CONSTRAINT "FK_7bf4a38f525c0de01a6c4226a04" REFERENCES categories(id) ON DELETE CASCADE ON UPDATE CASCADE,
        PRIMARY KEY (budget_id, category_id)
      )
    `);
    await queryRunner.query('CREATE INDEX "IDX_919faa73fd59efb0f80ccc3607" ON budget_categories(budget_id)');
    await queryRunner.query('CREATE INDEX "IDX_7bf4a38f525c0de01a6c4226a0" ON budget_categories(category_id)');

    await queryRunner.query(`
      CREATE TABLE budget_periods (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL CONSTRAINT "FK_ef790166ee259e4d2b825cdfdc2" REFERENCES users(id) ON DELETE CASCADE,
        budget_id uuid NOT NULL CONSTRAINT "FK_8aee1350827113b9237bfb35fd7" REFERENCES budgets(id) ON DELETE CASCADE,
        period varchar(20) NOT NULL,
        start_date date NOT NULL,
        end_date date NOT NULL,
        budgeted_amount numeric(14, 2) NOT NULL,
        status varchar(20) NOT NULL DEFAULT 'active',
        closed_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query('CREATE UNIQUE INDEX "IDX_0ebdb0b6b6d93f79213d0ab33d" ON budget_periods(budget_id, start_date, end_date)');
    await queryRunner.query('CREATE INDEX "IDX_c96716765cbc0151ae5df9a3dd" ON budget_periods(user_id, start_date, end_date)');

    await queryRunner.query(`
      CREATE TABLE scheduled_transactions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL CONSTRAINT "FK_304ce6862ee674f77f0d4be1a84" REFERENCES users(id) ON DELETE CASCADE,
        type varchar(20) NOT NULL,
        name varchar(120) NOT NULL,
        description varchar(140) NOT NULL,
        amount numeric(14, 2) NOT NULL,
        source_account_id uuid NOT NULL CONSTRAINT "FK_c1d8b4c7a82e41af7c7c44656a9" REFERENCES accounts(id) ON DELETE RESTRICT,
        category_id uuid NOT NULL CONSTRAINT "FK_f81b1dd280a24bd9e91cb33d324" REFERENCES categories(id) ON DELETE RESTRICT,
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
    await queryRunner.query('CREATE INDEX "IDX_dadb970867e31e6ae8cfaaaf53" ON scheduled_transactions(user_id, status, next_execution_date)');
    await queryRunner.query('CREATE INDEX "IDX_ca5fc33f7dc90f97834ef247e0" ON scheduled_transactions(user_id, status, next_execution_date, created_at, id)');
    await queryRunner.query('CREATE INDEX "IDX_e438230daf30a234512947348b" ON scheduled_transactions(locked_until)');

    await queryRunner.query(`
      CREATE TABLE transactions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL CONSTRAINT "FK_e9acc6efa76de013e8c1553ed2b" REFERENCES users(id) ON DELETE CASCADE,
        type varchar(20) NOT NULL,
        amount numeric(14, 2) NOT NULL,
        currency varchar(3) NOT NULL,
        destination_amount numeric(14, 2),
        destination_currency varchar(3),
        exchange_rate numeric(18, 8),
        source_account_id uuid NOT NULL CONSTRAINT "FK_a008a672b1acca7f679de9f2a2a" REFERENCES accounts(id) ON DELETE RESTRICT,
        destination_account_id uuid CONSTRAINT "FK_98c19d7f096b4ab011d3547eb0d" REFERENCES accounts(id) ON DELETE RESTRICT,
        category_id uuid CONSTRAINT "FK_c9e41213ca42d50132ed7ab2b0f" REFERENCES categories(id) ON DELETE RESTRICT,
        description varchar(140) NOT NULL,
        date date NOT NULL,
        status varchar(20) NOT NULL DEFAULT 'completed',
        source varchar(40) NOT NULL DEFAULT 'manual',
        scheduled_transaction_id uuid CONSTRAINT "FK_2fcc7c43a5da55c69a7faff4893" REFERENCES scheduled_transactions(id) ON DELETE SET NULL,
        scheduled_execution_date date,
        processed_at timestamptz,
        note varchar(500),
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query('CREATE INDEX "IDX_fe815e76e6d1e733cebfd0f903" ON transactions(user_id, date)');
    await queryRunner.query('CREATE INDEX "IDX_30d7e087222da09ebc66d1e6f4" ON transactions(user_id, date, created_at, id)');
    await queryRunner.query('CREATE INDEX "IDX_bd775a4270e9a969ba7e4c11af" ON transactions(user_id, type, status)');
    await queryRunner.query('CREATE INDEX "IDX_002b4aca7d3b019ee15acd2672" ON transactions(user_id, status, date)');
    await queryRunner.query('CREATE INDEX "IDX_a008a672b1acca7f679de9f2a2" ON transactions(source_account_id)');
    await queryRunner.query('CREATE INDEX "IDX_98c19d7f096b4ab011d3547eb0" ON transactions(destination_account_id)');
    await queryRunner.query('CREATE INDEX "IDX_c9e41213ca42d50132ed7ab2b0" ON transactions(category_id)');
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_1120db6b86825339ce8a5785f3"
        ON transactions(scheduled_transaction_id, scheduled_execution_date)
        WHERE scheduled_transaction_id IS NOT NULL AND scheduled_execution_date IS NOT NULL
    `);

    await queryRunner.query(`
      CREATE TABLE worker_job_runs (
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
    await queryRunner.query('CREATE INDEX "IDX_5eb4afc04ed286e12f681a8dc2" ON worker_job_runs(job_name, started_at)');

    await queryRunner.query(`
      CREATE TABLE worker_job_errors (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        job_run_id uuid NOT NULL CONSTRAINT "FK_7850d7832d3bb500459294adab0" REFERENCES worker_job_runs(id) ON DELETE CASCADE,
        job_name varchar(120) NOT NULL,
        entity_type varchar(120) NOT NULL,
        entity_id varchar(120) NOT NULL,
        attempt integer NOT NULL DEFAULT 1,
        error_message varchar(1000) NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query('CREATE INDEX "IDX_115eb0d3e99f53e033e4a953c0" ON worker_job_errors(job_name, created_at)');
    await queryRunner.query('CREATE INDEX "IDX_8ed5131f487a8b745162e5b29a" ON worker_job_errors(entity_type, entity_id)');

    await queryRunner.query(`
      CREATE TABLE email_synced_messages (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL,
        provider varchar(20) NOT NULL,
        external_message_id varchar(255) NOT NULL,
        status varchar(30) NOT NULL DEFAULT 'processed',
        transaction_id uuid,
        processed_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query('CREATE UNIQUE INDEX "IDX_5a672da114c6c4e43b625fd714" ON email_synced_messages(user_id, provider, external_message_id)');

    await queryRunner.query(`
      CREATE TABLE external_connections (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL CONSTRAINT "FK_55368297d105e1e7604b2f560a1" REFERENCES users(id) ON DELETE CASCADE,
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
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query('CREATE UNIQUE INDEX "IDX_03a9a19353451e83b3833d0549" ON external_connections(user_id, provider)');
    await queryRunner.query('CREATE INDEX "IDX_341b0d2ae29534eea75ec494f1" ON external_connections(status, provider)');

    await queryRunner.query(`
      CREATE TABLE email_import_rules (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL CONSTRAINT "FK_b2f8db92136799cf52601de45d1" REFERENCES users(id) ON DELETE CASCADE,
        bank_code varchar(40) NOT NULL,
        account_id uuid NOT NULL CONSTRAINT "FK_ae6ba0858f93a2035a7588fe8e8" REFERENCES accounts(id) ON DELETE RESTRICT,
        category_id uuid NOT NULL CONSTRAINT "FK_6a5149cad46e5068cf975c1f441" REFERENCES categories(id) ON DELETE RESTRICT,
        product_kind varchar(20) NOT NULL DEFAULT 'card',
        card_last_digits varchar(4),
        merchant_pattern varchar(120),
        status varchar(20) NOT NULL DEFAULT 'active',
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query('CREATE INDEX "IDX_f6210c529b0aea39d2c0ff3959" ON email_import_rules(user_id, bank_code, status)');
    await queryRunner.query('CREATE INDEX "IDX_3603ea43231e352a9afe13425a" ON email_import_rules(user_id, bank_code, card_last_digits)');

    await queryRunner.query(`
      CREATE TABLE imported_transactions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL CONSTRAINT "FK_9e644a8ce95919fe279861e6704" REFERENCES users(id) ON DELETE CASCADE,
        provider varchar(20) NOT NULL,
        external_message_id varchar(255) NOT NULL,
        bank_code varchar(40) NOT NULL,
        event_type varchar(30) NOT NULL,
        provider_status varchar(30) NOT NULL DEFAULT 'unknown',
        product_name varchar(120),
        card_last_digits varchar(4),
        merchant varchar(140) NOT NULL,
        amount numeric(14, 2) NOT NULL,
        currency varchar(3) NOT NULL,
        transaction_date date NOT NULL,
        account_id uuid CONSTRAINT "FK_82a5baef08378c9baa5b553d45f" REFERENCES accounts(id) ON DELETE SET NULL,
        category_id uuid CONSTRAINT "FK_d9d72c405f4bda76f7295504082" REFERENCES categories(id) ON DELETE SET NULL,
        confidence numeric(4, 3) NOT NULL DEFAULT 0,
        raw_description varchar(1000) NOT NULL,
        status varchar(30) NOT NULL DEFAULT 'needs_review',
        review_note varchar(500),
        transaction_id uuid CONSTRAINT "FK_65b0b5b60853d5b96b0ebc5b6c3" REFERENCES transactions(id) ON DELETE SET NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query('CREATE UNIQUE INDEX "IDX_a57771c2d4d8b67d702999ecd9" ON imported_transactions(user_id, provider, external_message_id)');
    await queryRunner.query('CREATE INDEX "IDX_aea76c6b097419ab0fccda90cb" ON imported_transactions(user_id, status, transaction_date)');
    await queryRunner.query('CREATE INDEX "IDX_e09ce8f9cee7307cfa0bc43f48" ON imported_transactions(user_id, bank_code, card_last_digits)');
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS imported_transactions');
    await queryRunner.query('DROP TABLE IF EXISTS email_import_rules');
    await queryRunner.query('DROP TABLE IF EXISTS external_connections');
    await queryRunner.query('DROP TABLE IF EXISTS email_synced_messages');
    await queryRunner.query('DROP TABLE IF EXISTS worker_job_errors');
    await queryRunner.query('DROP TABLE IF EXISTS worker_job_runs');
    await queryRunner.query('DROP TABLE IF EXISTS transactions');
    await queryRunner.query('DROP TABLE IF EXISTS scheduled_transactions');
    await queryRunner.query('DROP TABLE IF EXISTS budget_periods');
    await queryRunner.query('DROP TABLE IF EXISTS budget_categories');
    await queryRunner.query('DROP TABLE IF EXISTS budgets');
    await queryRunner.query('DROP TABLE IF EXISTS categories');
    await queryRunner.query('DROP TABLE IF EXISTS user_preferences');
    await queryRunner.query('DROP TABLE IF EXISTS accounts');
    await queryRunner.query('DROP TABLE IF EXISTS auth_throttle_buckets');
    await queryRunner.query('DROP TABLE IF EXISTS auth_sessions');
    await queryRunner.query('DROP TABLE IF EXISTS auth_identities');
    await queryRunner.query('DROP TABLE IF EXISTS users');
  }
}
