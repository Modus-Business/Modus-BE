import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNicknameReasonToGroupNicknames2026041300020
  implements MigrationInterface
{
  name = 'AddNicknameReasonToGroupNicknames2026041300020';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "group_nicknames"
      ADD COLUMN "nickname_reason" character varying(255)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "group_nicknames"
      DROP COLUMN "nickname_reason"
    `);
  }
}
