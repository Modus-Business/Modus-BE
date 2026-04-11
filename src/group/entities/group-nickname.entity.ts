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
import { Classroom } from '../../class/entities/class.entity';

@Entity({ name: 'group_nicknames' })
@Unique('uq_group_nicknames_class_participant_id', ['classParticipantId'])
@Unique('uq_group_nicknames_class_id_nickname', ['classId', 'nickname'])
export class GroupNickname {
  @PrimaryGeneratedColumn('uuid')
  groupNicknameId!: string;

  @Column({ type: 'uuid', name: 'class_id' })
  classId!: string;

  @Column({ type: 'uuid', name: 'class_participant_id' })
  classParticipantId!: string;

  @Column({ type: 'varchar', length: 100 })
  nickname!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => Classroom, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'class_id' })
  classroom!: Classroom;

  @OneToOne(
    () => ClassParticipant,
    (classParticipant) => classParticipant.groupNickname,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'class_participant_id' })
  classParticipant!: ClassParticipant;
}
