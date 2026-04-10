import { ApiProperty } from '@nestjs/swagger';

export class CreateGroupResponseDto {
  @ApiProperty({ example: 'group-1' })
  groupId!: string;

  @ApiProperty({ example: 'class-1' })
  classId!: string;

  @ApiProperty({ example: '모둠 3' })
  name!: string;

  @ApiProperty({ example: 4 })
  memberCount!: number;

  @ApiProperty()
  createdAt!: Date;
}
