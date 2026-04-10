import { ApiProperty } from '@nestjs/swagger';

export class MyGroupDto {
  @ApiProperty({
    example: '3f4d3db1-6dd7-4e1c-b34e-78f76bdcd001',
    nullable: true,
  })
  groupId!: string | null;

  @ApiProperty({ example: 'Group 3', nullable: true })
  name!: string | null;
}

export class ClassSummaryDto {
  @ApiProperty({ example: '0a11d54c-c75a-4d10-a4a0-1fd224c636c7' })
  classId!: string;

  @ApiProperty({ example: 'Project Studio' })
  name!: string;

  @ApiProperty({
    example: 'Main class for planning and delivering the service project.',
    nullable: true,
  })
  description!: string | null;

  @ApiProperty({ example: 'AB12-CD34', nullable: true })
  classCode!: string | null;

  @ApiProperty({ example: 21, nullable: true })
  studentCount!: number | null;

  @ApiProperty({ example: '2026-04-10T12:00:00.000Z', nullable: true })
  createdAt!: Date | null;

  @ApiProperty({
    type: MyGroupDto,
    nullable: true,
    example: {
      groupId: '3f4d3db1-6dd7-4e1c-b34e-78f76bdcd001',
      name: 'Group 3',
    },
  })
  myGroup!: MyGroupDto | null;
}

export class ClassesResponseDto {
  @ApiProperty({
    type: [ClassSummaryDto],
    example: [
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
      {
        classId: '9fdad8a7-5f45-4a4f-b6b1-26e0714d45d0',
        name: 'Design Systems',
        description:
          'Class focused on UI writing, layout structure, and feedback practice.',
        classCode: null,
        studentCount: null,
        createdAt: '2026-04-09T09:00:00.000Z',
        myGroup: null,
      },
    ],
  })
  classes!: ClassSummaryDto[];
}
