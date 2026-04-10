import { ApiProperty } from '@nestjs/swagger';

export class DeleteNoticeResponseDto {
  @ApiProperty({ example: '공지사항이 삭제되었습니다.' })
  message!: string;
}
