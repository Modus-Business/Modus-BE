import { ApiProperty } from '@nestjs/swagger';
import { ClassParticipantsResponseDto } from './class-participants.response.dto';

export class GetClassParticipantsSuccessResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: 200 })
  statusCode!: number;

  @ApiProperty({
    type: ClassParticipantsResponseDto,
    example: {
      classId: '0a11d54c-c75a-4d10-a4a0-1fd224c636c7',
      className: 'Project Studio',
      participants: [
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
    },
  })
  data!: ClassParticipantsResponseDto;

  @ApiProperty({
    example: '2026-04-11T12:00:00.000Z',
    format: 'date-time',
  })
  timestamp!: string;

  @ApiProperty({ example: '/classes/class-1/participants' })
  path!: string;
}
