import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEmailSyncImportReview1780000000003 implements MigrationInterface {
  name = 'AddEmailSyncImportReview1780000000003';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS pgcrypto');

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS email_import_rules (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        bank_code varchar(40) NOT NULL,
        account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
        category_id uuid NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
        product_kind varchar(20) NOT NULL DEFAULT 'card',
        card_last_digits varchar(4),
        merchant_pattern varchar(120),
        status varchar(20) NOT NULL DEFAULT 'active',
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS IDX_email_import_rules_user_bank_status ON email_import_rules(user_id, bank_code, status)',
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS IDX_email_import_rules_user_bank_digits ON email_import_rules(user_id, bank_code, card_last_digits)',
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS imported_transactions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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
        account_id uuid REFERENCES accounts(id) ON DELETE SET NULL,
        category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
        confidence numeric(4, 3) NOT NULL DEFAULT 0,
        raw_description varchar(1000) NOT NULL,
        status varchar(30) NOT NULL DEFAULT 'needs_review',
        review_note varchar(500),
        transaction_id uuid REFERENCES transactions(id) ON DELETE SET NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT UQ_imported_transactions_user_provider_message UNIQUE(user_id, provider, external_message_id)
      )
    `);
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS IDX_imported_transactions_user_status_date ON imported_transactions(user_id, status, transaction_date)',
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS IDX_imported_transactions_user_bank_digits ON imported_transactions(user_id, bank_code, card_last_digits)',
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS imported_transactions');
    await queryRunner.query('DROP TABLE IF EXISTS email_import_rules');
  }
}
