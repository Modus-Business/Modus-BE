import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddChatMessages2026041200020 implements MigrationInterface {
  name = 'AddChatMessages2026041200020';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "chat_messages" (
        "message_id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "group_id" uuid NOT NULL,
        "nickname" character varying(50) NOT NULL,
        "content" character varying(2000) NOT NULL,
        "sent_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_chat_messages_message_id" PRIMARY KEY ("message_id"),
        CONSTRAINT "FK_chat_messages_group_id_groups_groupId" FOREIGN KEY ("group_id") REFERENCES "groups"("groupId") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "ix_chat_messages_group_id_sent_at"
      ON "chat_messages" ("group_id", "sent_at")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX "public"."ix_chat_messages_group_id_sent_at"');
    await queryRunner.query('DROP TABLE "chat_messages"');
  }
}
