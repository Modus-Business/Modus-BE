import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateGroupNicknamesToClassScope1760000002000
  implements MigrationInterface
{
  name = 'UpdateGroupNicknamesToClassScope1760000002000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "group_nicknames"
      DROP CONSTRAINT "uq_group_nicknames_group_member_id"
    `);
    await queryRunner.query(`
      ALTER TABLE "group_nicknames"
      DROP CONSTRAINT "uq_group_nicknames_group_id_nickname"
    `);
    await queryRunner.query(`
      ALTER TABLE "group_nicknames"
      DROP CONSTRAINT "FK_group_nicknames_group_id_groups_groupId"
    `);
    await queryRunner.query(`
      ALTER TABLE "group_nicknames"
      DROP CONSTRAINT "FK_group_nicknames_group_member_id_group_members_groupMemberId"
    `);
    await queryRunner.query(`
      ALTER TABLE "group_nicknames"
      RENAME COLUMN "group_id" TO "class_id"
    `);
    await queryRunner.query(`
      ALTER TABLE "group_nicknames"
      RENAME COLUMN "group_member_id" TO "class_participant_id"
    `);
    await queryRunner.query(`
      UPDATE "group_nicknames" gn
      SET "class_id" = gm."group_id"
      FROM "group_members" gm
      WHERE gm."groupMemberId" = gn."class_participant_id"
    `);
    await queryRunner.query(`
      UPDATE "group_nicknames" gn
      SET "class_id" = g."class_id",
          "class_participant_id" = gm."class_participant_id"
      FROM "group_members" gm
      JOIN "groups" g ON g."groupId" = gm."group_id"
      WHERE gm."groupMemberId" = gn."class_participant_id"
    `);
    await queryRunner.query(`
      ALTER TABLE "group_nicknames"
      ADD CONSTRAINT "uq_group_nicknames_class_participant_id" UNIQUE ("class_participant_id")
    `);
    await queryRunner.query(`
      ALTER TABLE "group_nicknames"
      ADD CONSTRAINT "uq_group_nicknames_class_id_nickname" UNIQUE ("class_id", "nickname")
    `);
    await queryRunner.query(`
      ALTER TABLE "group_nicknames"
      ADD CONSTRAINT "FK_group_nicknames_class_id_classes_classId"
      FOREIGN KEY ("class_id") REFERENCES "classes"("classId") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "group_nicknames"
      ADD CONSTRAINT "FK_group_nicknames_class_participant_id_class_participants_classParticipantId"
      FOREIGN KEY ("class_participant_id") REFERENCES "class_participants"("classParticipantId") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "group_nicknames"
      DROP CONSTRAINT "uq_group_nicknames_class_participant_id"
    `);
    await queryRunner.query(`
      ALTER TABLE "group_nicknames"
      DROP CONSTRAINT "uq_group_nicknames_class_id_nickname"
    `);
    await queryRunner.query(`
      ALTER TABLE "group_nicknames"
      DROP CONSTRAINT "FK_group_nicknames_class_id_classes_classId"
    `);
    await queryRunner.query(`
      ALTER TABLE "group_nicknames"
      DROP CONSTRAINT "FK_group_nicknames_class_participant_id_class_participants_classParticipantId"
    `);
    await queryRunner.query(`
      ALTER TABLE "group_nicknames"
      RENAME COLUMN "class_id" TO "group_id"
    `);
    await queryRunner.query(`
      ALTER TABLE "group_nicknames"
      RENAME COLUMN "class_participant_id" TO "group_member_id"
    `);
    await queryRunner.query(`
      ALTER TABLE "group_nicknames"
      ADD CONSTRAINT "uq_group_nicknames_group_member_id" UNIQUE ("group_member_id")
    `);
    await queryRunner.query(`
      ALTER TABLE "group_nicknames"
      ADD CONSTRAINT "uq_group_nicknames_group_id_nickname" UNIQUE ("group_id", "nickname")
    `);
    await queryRunner.query(`
      ALTER TABLE "group_nicknames"
      ADD CONSTRAINT "FK_group_nicknames_group_id_groups_groupId"
      FOREIGN KEY ("group_id") REFERENCES "groups"("groupId") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "group_nicknames"
      ADD CONSTRAINT "FK_group_nicknames_group_member_id_group_members_groupMemberId"
      FOREIGN KEY ("group_member_id") REFERENCES "group_members"("groupMemberId") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }
}
