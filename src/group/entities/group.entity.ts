import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Classroom } from '../../class/entities/class.entity';
import { GroupMember } from './group-member.entity';
import { GroupNickname } from './group-nickname.entity';

@Entity({ name: 'groups' })
export class Group {
  @PrimaryGeneratedColumn('uuid')
  groupId!: string;

  @Column({ type: 'uuid', name: 'class_id' })
  classId!: string;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => Classroom, (classroom) => classroom.groups, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'class_id' })
  classroom!: Classroom;

  @OneToMany(() => GroupMember, (groupMember) => groupMember.group)
  groupMembers!: GroupMember[];

  @OneToMany(() => GroupNickname, (groupNickname) => groupNickname.group)
  groupNicknames!: GroupNickname[];
}
