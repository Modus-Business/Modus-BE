import { ApiProperty } from '@nestjs/swagger';

export class ClassParticipantGroupDto {
  @ApiProperty({
    example: '3f4d3db1-6dd7-4e1c-b34e-78f76bdcd001',
    nullable: true,
  })
  groupId!: string | null;

  @ApiProperty({ example: '모둠 3', nullable: true })
  name!: string | null;
}

export class ClassParticipantItemDto {
  @ApiProperty({ example: '2d39e0b6-f2d2-47fb-82d0-1e0f43be9f87' })
  classParticipantId!: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  studentId!: string;

  @ApiProperty({ example: '홍길동' })
  studentName!: string;

  @ApiProperty({ example: 'student@example.com' })
  email!: string;

  @ApiProperty({ example: '조용한 구름', nullable: true })
  nickname!: string | null;

  @ApiProperty({
    type: ClassParticipantGroupDto,
    nullable: true,
    example: {
      groupId: '3f4d3db1-6dd7-4e1c-b34e-78f76bdcd001',
      name: '모둠 3',
    },
  })
  group!: ClassParticipantGroupDto | null;

  @ApiProperty({ example: '2026-04-10T12:00:00.000Z' })
  joinedAt!: Date;

  @ApiProperty({ example: '2026-04-10T12:30:00.000Z', nullable: true })
  groupJoinedAt!: Date | null;
}

export class ClassParticipantsResponseDto {
  @ApiProperty({ example: '0a11d54c-c75a-4d10-a4a0-1fd224c636c7' })
  classId!: string;

  @ApiProperty({ example: 'Project Studio' })
  className!: string;

  @ApiProperty({
    type: [ClassParticipantItemDto],
    example: [
      {
        classParticipantId: '2d39e0b6-f2d2-47fb-82d0-1e0f43be9f87',
        studentId: '550e8400-e29b-41d4-a716-446655440000',
        studentName: '홍길동',
        email: 'student@example.com',
        nickname: '조용한 구름',
        group: {
          groupId: '3f4d3db1-6dd7-4e1c-b34e-78f76bdcd001',
          name: '모둠 3',
        },
        joinedAt: '2026-04-10T12:00:00.000Z',
        groupJoinedAt: '2026-04-10T12:30:00.000Z',
      },
    ],
  })
  participants!: ClassParticipantItemDto[];
}
