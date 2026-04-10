import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1744260000000 implements MigrationInterface {
  name = 'InitialSchema1744260000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');
    await queryRunner.query(
      "CREATE TYPE \"public\".\"user_role\" AS ENUM('student', 'teacher')",
    );
    await queryRunner.query(`
      CREATE TABLE "users" (
        "userId" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" character varying(30) NOT NULL,
        "email" character varying(255) NOT NULL,
        "passwordHash" character varying(255) NOT NULL,
        "isEmailVerified" boolean NOT NULL DEFAULT false,
        "role" "public"."user_role" NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "uq_users_email" UNIQUE ("email"),
        CONSTRAINT "PK_users_userId" PRIMARY KEY ("userId")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "classes" (
        "classId" uuid NOT NULL DEFAULT gen_random_uuid(),
        "teacher_id" uuid NOT NULL,
        "name" character varying(100) NOT NULL,
        "description" character varying(500),
        "class_code" character varying(30) NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_classes_class_code" UNIQUE ("class_code"),
        CONSTRAINT "PK_classes_classId" PRIMARY KEY ("classId"),
        CONSTRAINT "FK_classes_teacher_id_users_userId" FOREIGN KEY ("teacher_id") REFERENCES "users"("userId") ON DELETE NO ACTION ON UPDATE NO ACTION
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "refresh_tokens" (
        "refreshTokenId" uuid NOT NULL DEFAULT gen_random_uuid(),
        "userId" uuid NOT NULL,
        "tokenHash" character varying(255) NOT NULL,
        "expiresAt" TIMESTAMP NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "uq_refresh_tokens_user_id" UNIQUE ("userId"),
        CONSTRAINT "PK_refresh_tokens_refreshTokenId" PRIMARY KEY ("refreshTokenId"),
        CONSTRAINT "FK_refresh_tokens_userId_users_userId" FOREIGN KEY ("userId") REFERENCES "users"("userId") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "class_participants" (
        "classParticipantId" uuid NOT NULL DEFAULT gen_random_uuid(),
        "class_id" uuid NOT NULL,
        "student_id" uuid NOT NULL,
        "joined_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "uq_class_participants_class_id_student_id" UNIQUE ("class_id", "student_id"),
        CONSTRAINT "PK_class_participants_classParticipantId" PRIMARY KEY ("classParticipantId"),
        CONSTRAINT "FK_class_participants_class_id_classes_classId" FOREIGN KEY ("class_id") REFERENCES "classes"("classId") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_class_participants_student_id_users_userId" FOREIGN KEY ("student_id") REFERENCES "users"("userId") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "groups" (
        "groupId" uuid NOT NULL DEFAULT gen_random_uuid(),
        "class_id" uuid NOT NULL,
        "name" character varying(100) NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_groups_groupId" PRIMARY KEY ("groupId"),
        CONSTRAINT "FK_groups_class_id_classes_classId" FOREIGN KEY ("class_id") REFERENCES "classes"("classId") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "group_members" (
        "groupMemberId" uuid NOT NULL DEFAULT gen_random_uuid(),
        "group_id" uuid NOT NULL,
        "class_participant_id" uuid NOT NULL,
        "joined_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "uq_group_members_class_participant_id" UNIQUE ("class_participant_id"),
        CONSTRAINT "PK_group_members_groupMemberId" PRIMARY KEY ("groupMemberId"),
        CONSTRAINT "FK_group_members_group_id_groups_groupId" FOREIGN KEY ("group_id") REFERENCES "groups"("groupId") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_group_members_class_participant_id_class_participants_classParticipantId" FOREIGN KEY ("class_participant_id") REFERENCES "class_participants"("classParticipantId") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "notices" (
        "noticeId" uuid NOT NULL DEFAULT gen_random_uuid(),
        "group_id" uuid NOT NULL,
        "title" character varying(100) NOT NULL,
        "content" character varying(2000) NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_notices_noticeId" PRIMARY KEY ("noticeId"),
        CONSTRAINT "FK_notices_group_id_groups_groupId" FOREIGN KEY ("group_id") REFERENCES "groups"("groupId") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "assignment_submissions" (
        "submissionId" uuid NOT NULL DEFAULT gen_random_uuid(),
        "group_id" uuid NOT NULL,
        "file_url" character varying(2000),
        "link" character varying(2000),
        "submitted_by" uuid NOT NULL,
        "submitted_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "uq_assignment_submissions_group_id" UNIQUE ("group_id"),
        CONSTRAINT "PK_assignment_submissions_submissionId" PRIMARY KEY ("submissionId"),
        CONSTRAINT "FK_assignment_submissions_group_id_groups_groupId" FOREIGN KEY ("group_id") REFERENCES "groups"("groupId") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_assignment_submissions_submitted_by_users_userId" FOREIGN KEY ("submitted_by") REFERENCES "users"("userId") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "surveys" (
        "surveyId" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "mbti" character varying(4),
        "personality" character varying(1000),
        "preference" character varying(1000),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_surveys_user_id" UNIQUE ("user_id"),
        CONSTRAINT "PK_surveys_surveyId" PRIMARY KEY ("surveyId"),
        CONSTRAINT "FK_surveys_user_id_users_userId" FOREIGN KEY ("user_id") REFERENCES "users"("userId") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "surveys"');
    await queryRunner.query('DROP TABLE "assignment_submissions"');
    await queryRunner.query('DROP TABLE "notices"');
    await queryRunner.query('DROP TABLE "group_members"');
    await queryRunner.query('DROP TABLE "groups"');
    await queryRunner.query('DROP TABLE "class_participants"');
    await queryRunner.query('DROP TABLE "refresh_tokens"');
    await queryRunner.query('DROP TABLE "classes"');
    await queryRunner.query('DROP TABLE "users"');
    await queryRunner.query('DROP TYPE "public"."user_role"');
  }
}
