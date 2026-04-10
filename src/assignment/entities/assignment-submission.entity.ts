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
import { User } from '../../auth/signup/entities/user.entity';
import { Group } from '../../group/entities/group.entity';

@Entity({ name: 'assignment_submissions' })
@Unique('uq_assignment_submissions_group_id', ['groupId'])
export class AssignmentSubmission {
  @PrimaryGeneratedColumn('uuid')
  submissionId!: string;

  @Column({ type: 'uuid', name: 'group_id' })
  groupId!: string;

  @Column({ type: 'varchar', length: 2000, nullable: true, name: 'file_url' })
  fileUrl!: string | null;

  @Column({ type: 'varchar', length: 2000, nullable: true })
  link!: string | null;

  @Column({ type: 'uuid', name: 'submitted_by' })
  submittedBy!: string;

  @CreateDateColumn({ name: 'submitted_at' })
  submittedAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @ManyToOne(() => Group, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'group_id' })
  group!: Group;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'submitted_by' })
  submitter!: User;
}
