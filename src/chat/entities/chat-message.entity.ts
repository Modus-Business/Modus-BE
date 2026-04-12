import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'chat_messages' })
@Index('ix_chat_messages_group_id_sent_at', ['groupId', 'sentAt'])
export class ChatMessage {
  @PrimaryGeneratedColumn('uuid', { name: 'message_id' })
  messageId!: string;

  @Column({ type: 'uuid', name: 'group_id' })
  groupId!: string;

  @Column({ type: 'varchar', length: 50 })
  nickname!: string;

  @Column({ type: 'varchar', length: 2000 })
  content!: string;

  @CreateDateColumn({ name: 'sent_at' })
  sentAt!: Date;
}
