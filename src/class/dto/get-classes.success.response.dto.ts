import { ApiProperty } from '@nestjs/swagger';
import { ClassesResponseDto } from './classes.response.dto';

export class GetClassesSuccessResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: 200 })
  statusCode!: number;

  @ApiProperty({
    type: ClassesResponseDto,
    example: {
      classes: [
        {
          classId: '0a11d54c-c75a-4d10-a4a0-1fd224c636c7',
          name: 'Project Studio',
          description:
            'Main class for planning and delivering the service project.',
          classCode: null,
          studentCount: null,
          createdAt: '2026-04-10T12:00:00.000Z',
          myGroup: {
            groupId: '3f4d3db1-6dd7-4e1c-b34e-78f76bdcd001',
            name: 'Group 3',
          },
        },
      ],
    },
  })
  data!: ClassesResponseDto;

  @ApiProperty({
    example: '2026-04-11T12:00:00.000Z',
    format: 'date-time',
  })
  timestamp!: string;

  @ApiProperty({ example: '/classes' })
  path!: string;
}
