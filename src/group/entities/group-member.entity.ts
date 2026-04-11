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
import { ClassParticipant } from '../../class/entities/class-participant.entity';
import { Group } from './group.entity';

@Entity({ name: 'group_members' })
@Unique('uq_group_members_class_participant_id', ['classParticipantId'])
export class GroupMember {
  @PrimaryGeneratedColumn('uuid')
  groupMemberId!: string;

  @Column({ type: 'uuid', name: 'group_id' })
  groupId!: string;

  @Column({ type: 'uuid', name: 'class_participant_id' })
  classParticipantId!: string;

  @CreateDateColumn({ name: 'joined_at' })
  joinedAt!: Date;

  @ManyToOne(() => Group, (group) => group.groupMembers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'group_id' })
  group!: Group;

  @OneToOne(
    () => ClassParticipant,
    (classParticipant) => classParticipant.groupMember,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'class_participant_id' })
  classParticipant!: ClassParticipant;
}
