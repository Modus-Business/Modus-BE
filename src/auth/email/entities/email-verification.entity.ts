import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../signup/entities/user.entity';

@Entity({ name: 'email_verifications' })
@Unique('uq_email_verifications_user_id', ['userId'])
export class EmailVerification {
  @PrimaryGeneratedColumn('uuid')
  emailVerificationId!: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId!: string;

  @Column({ type: 'varchar', length: 6 })
  code!: string;

  @Column({ type: 'timestamp', name: 'expires_at' })
  expiresAt!: Date;

  @Column({
    type: 'timestamp',
    name: 'last_sent_at',
    nullable: true,
  })
  lastSentAt!: Date | null;

  @Column({
    type: 'int',
    name: 'failed_attempt_count',
    default: 0,
  })
  failedAttemptCount!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;
}
