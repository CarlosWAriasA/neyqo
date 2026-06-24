import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMultiCurrencyTransfers1780000000005 implements MigrationInterface {
  name = 'AddMultiCurrencyTransfers1780000000005';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE transactions
        ADD COLUMN IF NOT EXISTS destination_amount numeric(14, 2),
        ADD COLUMN IF NOT EXISTS destination_currency varchar(3),
        ADD COLUMN IF NOT EXISTS exchange_rate numeric(18, 8)
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE transactions
        DROP COLUMN IF EXISTS exchange_rate,
        DROP COLUMN IF EXISTS destination_currency,
        DROP COLUMN IF EXISTS destination_amount
    `);
  }
}
