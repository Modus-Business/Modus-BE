import { ApiProperty } from '@nestjs/swagger';

export class MyGroupSummaryDto {
  @ApiProperty({ example: 'group-1' })
  groupId!: string;

  @ApiProperty({ example: 'class-1' })
  classId!: string;

  @ApiProperty({ example: '모둠 3' })
  name!: string;

  @ApiProperty({ example: 4 })
  memberCount!: number;
}

export class MyGroupResponseDto {
  @ApiProperty({ example: true })
  hasGroup!: boolean;

  @ApiProperty({
    type: MyGroupSummaryDto,
    nullable: true,
    example: {
      groupId: 'group-1',
      classId: 'class-1',
      name: '모둠 3',
      memberCount: 4,
    },
  })
  group!: MyGroupSummaryDto | null;

  @ApiProperty({
    example: null,
    nullable: true,
  })
  message!: string | null;
}
