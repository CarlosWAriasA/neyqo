import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddInitialDataNoticeShownToUsers1780000000001 implements MigrationInterface {
  name = 'AddInitialDataNoticeShownToUsers1780000000001';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS initial_data_notice_shown boolean NOT NULL DEFAULT false
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users
        DROP COLUMN IF EXISTS initial_data_notice_shown
    `);
  }
}
