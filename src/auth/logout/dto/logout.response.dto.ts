import { ApiProperty } from '@nestjs/swagger';

export class LogoutResponseDto {
  @ApiProperty({ example: '로그아웃되었습니다.' })
  message!: string;
}
