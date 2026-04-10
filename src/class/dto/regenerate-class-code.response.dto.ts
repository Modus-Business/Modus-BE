import { ApiProperty } from '@nestjs/swagger';

export class RegenerateClassCodeResponseDto {
  @ApiProperty({ example: 'class-1' })
  classId!: string;

  @ApiProperty({ example: 'BC34-DA12' })
  classCode!: string;

  @ApiProperty()
  updatedAt!: Date;
}
