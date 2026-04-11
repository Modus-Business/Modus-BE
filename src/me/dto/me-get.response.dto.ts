import { ApiProperty } from '@nestjs/swagger';
import { MeSettingsResponseDto } from './me-settings.response.dto';

export class GetMeSettingsSuccessResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: 200 })
  statusCode!: number;

  @ApiProperty({
    type: MeSettingsResponseDto,
    example: {
      name: '홍길동',
      email: 'user@example.com',
      isEmailVerified: true,
      role: 'student',
    },
  })
  data!: MeSettingsResponseDto;

  @ApiProperty({ example: '2026-04-11T12:00:00.000Z' })
  timestamp!: string;

  @ApiProperty({ example: '/me/settings' })
  path!: string;
}
