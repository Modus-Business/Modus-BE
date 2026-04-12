import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateNoticesToClassScope202604120001
  implements MigrationInterface
{
  name = 'UpdateNoticesToClassScope202604120001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "notices"
      ADD COLUMN "class_id" uuid
    `);

    await queryRunner.query(`
      UPDATE "notices" n
      SET "class_id" = g."class_id"
      FROM "groups" g
      WHERE n."group_id" = g."groupId"
    `);

    await queryRunner.query(`
      ALTER TABLE "notices"
      ALTER COLUMN "class_id" SET NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "notices"
      DROP CONSTRAINT "FK_notices_group_id_groups_groupId"
    `);

    await queryRunner.query(`
      ALTER TABLE "notices"
      DROP COLUMN "group_id"
    `);

    await queryRunner.query(`
      ALTER TABLE "notices"
      ADD CONSTRAINT "FK_notices_class_id_classes_classId"
      FOREIGN KEY ("class_id") REFERENCES "classes"("classId")
      ON DELETE CASCADE
      ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "notices"
      ADD COLUMN "group_id" uuid
    `);

    await queryRunner.query(`
      UPDATE "notices" n
      SET "group_id" = g."groupId"
      FROM "groups" g
      WHERE n."class_id" = g."class_id"
        AND g."createdAt" = (
          SELECT MIN(g2."createdAt")
          FROM "groups" g2
          WHERE g2."class_id" = n."class_id"
        )
    `);

    await queryRunner.query(`
      ALTER TABLE "notices"
      ALTER COLUMN "group_id" SET NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "notices"
      DROP CONSTRAINT "FK_notices_class_id_classes_classId"
    `);

    await queryRunner.query(`
      ALTER TABLE "notices"
      DROP COLUMN "class_id"
    `);

    await queryRunner.query(`
      ALTER TABLE "notices"
      ADD CONSTRAINT "FK_notices_group_id_groups_groupId"
      FOREIGN KEY ("group_id") REFERENCES "groups"("groupId")
      ON DELETE CASCADE
      ON UPDATE NO ACTION
    `);
  }
}
