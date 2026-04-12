import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnsureChatMessageSenderUserId2026041200030
  implements MigrationInterface
{
  name = 'EnsureChatMessageSenderUserId2026041200030';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "chat_messages"
      ADD COLUMN IF NOT EXISTS "sender_user_id" uuid
    `);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'FK_chat_messages_sender_user_id_users_userId'
        ) THEN
          ALTER TABLE "chat_messages"
          ADD CONSTRAINT "FK_chat_messages_sender_user_id_users_userId"
          FOREIGN KEY ("sender_user_id")
          REFERENCES "users"("userId")
          ON DELETE CASCADE
          ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // This repair migration is intentionally not reversible because
    // environments may already rely on sender_user_id existing.
    await queryRunner.query('SELECT 1');
  }
}
