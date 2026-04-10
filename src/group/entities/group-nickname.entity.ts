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
import { Group } from './group.entity';
import { GroupMember } from './group-member.entity';

@Entity({ name: 'group_nicknames' })
@Unique('uq_group_nicknames_group_member_id', ['groupMemberId'])
@Unique('uq_group_nicknames_group_id_nickname', ['groupId', 'nickname'])
export class GroupNickname {
  @PrimaryGeneratedColumn('uuid')
  groupNicknameId!: string;

  @Column({ type: 'uuid', name: 'group_id' })
  groupId!: string;

  @Column({ type: 'uuid', name: 'group_member_id' })
  groupMemberId!: string;

  @Column({ type: 'varchar', length: 100 })
  nickname!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => Group, (group) => group.groupNicknames, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'group_id' })
  group!: Group;

  @OneToOne(() => GroupMember, (groupMember) => groupMember.groupNickname, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'group_member_id' })
  groupMember!: GroupMember;
}
