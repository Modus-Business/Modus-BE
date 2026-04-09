import { ApiProperty } from '@nestjs/swagger';

export class LoginResponseDto {
  @ApiProperty({ example: 'todo-access-token' })
  accessToken!: string;

  @ApiProperty({ example: 'user@example.com' })
  email!: string;
}
