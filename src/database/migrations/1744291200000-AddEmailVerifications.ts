import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEmailVerifications1744291200000
  implements MigrationInterface
{
  name = 'AddEmailVerifications1744291200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "email_verifications" (
        "emailVerificationId" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "code" character varying(6) NOT NULL,
        "expires_at" TIMESTAMP NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "uq_email_verifications_user_id" UNIQUE ("user_id"),
        CONSTRAINT "PK_email_verifications_emailVerificationId" PRIMARY KEY ("emailVerificationId"),
        CONSTRAINT "FK_email_verifications_user_id_users_userId" FOREIGN KEY ("user_id") REFERENCES "users"("userId") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "email_verifications"');
  }
}
