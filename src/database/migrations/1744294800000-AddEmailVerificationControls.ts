import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEmailVerificationControls1744294800000
  implements MigrationInterface
{
  name = 'AddEmailVerificationControls1744294800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "email_verifications"
      ADD COLUMN "last_sent_at" TIMESTAMP
    `);
    await queryRunner.query(`
      ALTER TABLE "email_verifications"
      ADD COLUMN "failed_attempt_count" integer NOT NULL DEFAULT 0
    `);
    await queryRunner.query(`
      UPDATE "email_verifications"
      SET "last_sent_at" = "updated_at",
          "failed_attempt_count" = 0
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "email_verifications"
      DROP COLUMN "failed_attempt_count"
    `);
    await queryRunner.query(`
      ALTER TABLE "email_verifications"
      DROP COLUMN "last_sent_at"
    `);
  }
}
