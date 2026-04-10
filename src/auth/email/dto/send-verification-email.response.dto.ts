import { ApiProperty } from '@nestjs/swagger';

export class SendVerificationEmailResponseDto {
  @ApiProperty({ example: '인증 코드가 이메일로 발송되었습니다.' })
  message!: string;

  @ApiProperty({ example: '2026-04-10T12:10:00.000Z' })
  expiresAt!: Date;
}
