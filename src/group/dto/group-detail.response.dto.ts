import { ApiProperty } from '@nestjs/swagger';

export class GroupDetailMemberDto {
  @ApiProperty({ example: 'group-member-1' })
  groupMemberId!: string;

  @ApiProperty({ example: '모둠원 1' })
  displayName!: string;

  @ApiProperty({ example: true })
  isMe!: boolean;
}

export class GroupDetailResponseDto {
  @ApiProperty({ example: 'group-1' })
  groupId!: string;

  @ApiProperty({ example: 'class-1' })
  classId!: string;

  @ApiProperty({ example: 'CLASS2026' })
  classCode!: string;

  @ApiProperty({ example: '모둠 3' })
  name!: string;

  @ApiProperty({ example: 4 })
  memberCount!: number;

  @ApiProperty({ type: [GroupDetailMemberDto] })
  members!: GroupDetailMemberDto[];
}
