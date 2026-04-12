import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNicknameReservations2026041300010
  implements MigrationInterface
{
  name = 'AddNicknameReservations2026041300010';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "nickname_reservations" (
        "nicknameReservationId" uuid NOT NULL DEFAULT gen_random_uuid(),
        "nickname" character varying(100) NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_nickname_reservations_nicknameReservationId" PRIMARY KEY ("nicknameReservationId"),
        CONSTRAINT "uq_nickname_reservations_nickname" UNIQUE ("nickname")
      )
    `);

    await queryRunner.query(`
      INSERT INTO "nickname_reservations" ("nickname")
      SELECT DISTINCT "nickname"
      FROM "group_nicknames"
      WHERE "nickname" IS NOT NULL
      ON CONFLICT ("nickname") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "nickname_reservations"');
  }
}
