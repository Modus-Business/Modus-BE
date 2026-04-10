import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGroupNicknames1744284000000 implements MigrationInterface {
  name = 'AddGroupNicknames1744284000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "group_nicknames" (
        "groupNicknameId" uuid NOT NULL DEFAULT gen_random_uuid(),
        "group_id" uuid NOT NULL,
        "group_member_id" uuid NOT NULL,
        "nickname" character varying(100) NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "uq_group_nicknames_group_member_id" UNIQUE ("group_member_id"),
        CONSTRAINT "uq_group_nicknames_group_id_nickname" UNIQUE ("group_id", "nickname"),
        CONSTRAINT "PK_group_nicknames_groupNicknameId" PRIMARY KEY ("groupNicknameId"),
        CONSTRAINT "FK_group_nicknames_group_id_groups_groupId" FOREIGN KEY ("group_id") REFERENCES "groups"("groupId") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_group_nicknames_group_member_id_group_members_groupMemberId" FOREIGN KEY ("group_member_id") REFERENCES "group_members"("groupMemberId") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "group_nicknames"');
  }
}
