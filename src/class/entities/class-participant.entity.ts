import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { GroupMember } from '../../group/entities/group-member.entity';
import { GroupNickname } from '../../group/entities/group-nickname.entity';
import { User } from '../../auth/signup/entities/user.entity';
import { Classroom } from './class.entity';

@Entity({ name: 'class_participants' })
@Unique('uq_class_participants_class_id_student_id', ['classId', 'studentId'])
export class ClassParticipant {
  @PrimaryGeneratedColumn('uuid')
  classParticipantId!: string;

  @Column({ type: 'uuid', name: 'class_id' })
  classId!: string;

  @Column({ type: 'uuid', name: 'student_id' })
  studentId!: string;

  @CreateDateColumn({ name: 'joined_at' })
  joinedAt!: Date;

  @ManyToOne(() => Classroom, (classroom) => classroom.classParticipants, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'class_id' })
  classroom!: Classroom;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student!: User;

  @OneToOne(() => GroupMember, (groupMember) => groupMember.classParticipant)
  groupMember!: GroupMember | null;

  @OneToOne(
    () => GroupNickname,
    (groupNickname) => groupNickname.classParticipant,
  )
  groupNickname?: GroupNickname | null;
}
