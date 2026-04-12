import { ApiProperty } from '@nestjs/swagger';

export class GroupMemberSummaryDto {
  @ApiProperty({ example: 'group-member-1' })
  groupMemberId!: string;

  @ApiProperty({ example: 'participant-1' })
  classParticipantId!: string;

  @ApiProperty({ example: 'student-1' })
  studentId!: string;

  @ApiProperty({ example: '홍길동' })
  studentName!: string;

  @ApiProperty({ example: 'student@example.com' })
  email!: string;

  @ApiProperty({ example: '조용한 구름', nullable: true })
  nickname!: string | null;

  @ApiProperty()
  joinedAt!: Date;
}

export class GroupSummaryDto {
  @ApiProperty({ example: 'group-1' })
  groupId!: string;

  @ApiProperty({ example: 'class-1' })
  classId!: string;

  @ApiProperty({ example: '모둠 3' })
  name!: string;

  @ApiProperty({ example: 4 })
  memberCount!: number;

  @ApiProperty({ type: [GroupMemberSummaryDto] })
  members!: GroupMemberSummaryDto[];

  @ApiProperty()
  createdAt!: Date;
}

export class GroupListResponseDto {
  @ApiProperty({ type: [GroupSummaryDto] })
  groups!: GroupSummaryDto[];
}
