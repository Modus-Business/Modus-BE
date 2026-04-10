import { ApiProperty } from '@nestjs/swagger';

export class LoginResponseDto {
  @ApiProperty({ example: '임시-액세스-토큰' })
  accessToken!: string;

  @ApiProperty({ example: 'user@example.com' })
  email!: string;
}
