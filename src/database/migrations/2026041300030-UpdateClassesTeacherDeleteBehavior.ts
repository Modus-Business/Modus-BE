import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateClassesTeacherDeleteBehavior2026041300030
  implements MigrationInterface
{
  name = 'UpdateClassesTeacherDeleteBehavior2026041300030';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "classes"
      DROP CONSTRAINT "FK_classes_teacher_id_users_userId"
    `);

    await queryRunner.query(`
      ALTER TABLE "classes"
      ADD CONSTRAINT "FK_classes_teacher_id_users_userId"
      FOREIGN KEY ("teacher_id") REFERENCES "users"("userId")
      ON DELETE CASCADE
      ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "classes"
      DROP CONSTRAINT "FK_classes_teacher_id_users_userId"
    `);

    await queryRunner.query(`
      ALTER TABLE "classes"
      ADD CONSTRAINT "FK_classes_teacher_id_users_userId"
      FOREIGN KEY ("teacher_id") REFERENCES "users"("userId")
      ON DELETE NO ACTION
      ON UPDATE NO ACTION
    `);
  }
}
