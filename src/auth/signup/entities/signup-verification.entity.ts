import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'signup_verifications' })
@Unique('uq_signup_verifications_email', ['email'])
export class SignupVerification {
  @PrimaryGeneratedColumn('uuid')
  signupVerificationId!: string;

  @Column({ type: 'varchar', length: 255 })
  email!: string;

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
}
