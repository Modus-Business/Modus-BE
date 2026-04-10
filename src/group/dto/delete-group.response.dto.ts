import { ApiProperty } from '@nestjs/swagger';

export class DeleteGroupResponseDto {
  @ApiProperty({ example: '모둠이 삭제되었습니다.' })
  message!: string;
}
