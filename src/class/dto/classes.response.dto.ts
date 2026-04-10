import { ApiProperty } from '@nestjs/swagger';

export class MyGroupDto {
  @ApiProperty({ example: '3f4d3db1-6dd7-4e1c-b34e-78f76bdcd001', nullable: true })
  groupId!: string | null;

  @ApiProperty({ example: '모둠 3', nullable: true })
  name!: string | null;
}

export class ClassSummaryDto {
  @ApiProperty({ example: '0a11d54c-c75a-4d10-a4a0-1fd224c636c7' })
  classId!: string;

  @ApiProperty({ example: '프로덕트 스튜디오' })
  name!: string;

  @ApiProperty({
    example: '서비스 구조 설계와 퍼블리싱을 함께 진행하는 메인 실습 수업',
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
      name: '모둠 3',
    },
  })
  myGroup!: MyGroupDto | null;
}

export class ClassesResponseDto {
  @ApiProperty({
    type: ClassSummaryDto,
    isArray: true,
  })
  classes!: ClassSummaryDto[];
}
