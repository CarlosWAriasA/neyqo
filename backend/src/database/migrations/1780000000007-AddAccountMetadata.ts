import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAccountMetadata1780000000007 implements MigrationInterface {
  name = 'AddAccountMetadata1780000000007';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE accounts
        ADD COLUMN IF NOT EXISTS institution_name varchar(90),
        ADD COLUMN IF NOT EXISTS last_four varchar(4)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_accounts_user_currency_status
        ON accounts(user_id, currency, status)
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS idx_accounts_user_currency_status');

    await queryRunner.query(`
      ALTER TABLE accounts
        DROP COLUMN IF EXISTS last_four,
        DROP COLUMN IF EXISTS institution_name
    `);
  }
}
