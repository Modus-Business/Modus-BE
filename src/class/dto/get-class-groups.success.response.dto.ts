import { ApiProperty } from '@nestjs/swagger';
import { GroupListResponseDto } from '../../group/dto/group-list.response.dto';

export class GetClassGroupsSuccessResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: 200 })
  statusCode!: number;

  @ApiProperty({
    type: GroupListResponseDto,
    example: {
      groups: [
        {
          groupId: '3f4d3db1-6dd7-4e1c-b34e-78f76bdcd001',
          classId: '0a11d54c-c75a-4d10-a4a0-1fd224c636c7',
          name: '모둠 3',
          memberCount: 4,
          createdAt: '2026-04-10T12:00:00.000Z',
        },
      ],
    },
  })
  data!: GroupListResponseDto;

  @ApiProperty({
    example: '2026-04-11T12:00:00.000Z',
    format: 'date-time',
  })
  timestamp!: string;

  @ApiProperty({ example: '/classes/class-1/groups' })
  path!: string;
}
