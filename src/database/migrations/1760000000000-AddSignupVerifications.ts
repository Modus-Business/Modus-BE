import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSignupVerifications1760000000000
  implements MigrationInterface
{
  name = 'AddSignupVerifications1760000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "signup_verifications" (
        "signupVerificationId" uuid NOT NULL DEFAULT gen_random_uuid(),
        "email" character varying(255) NOT NULL,
        "code" character varying(6) NOT NULL,
        "expires_at" TIMESTAMP NOT NULL,
        "last_sent_at" TIMESTAMP,
        "failed_attempt_count" integer NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "uq_signup_verifications_email" UNIQUE ("email"),
        CONSTRAINT "PK_signup_verifications_signupVerificationId" PRIMARY KEY ("signupVerificationId")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "signup_verifications"');
  }
}
