import { ApiProperty } from '@nestjs/swagger';

export class ErrorResponseDto {
  @ApiProperty({ example: false })
  success!: false;

  @ApiProperty({ example: 404 })
  statusCode!: number;

  @ApiProperty({ example: '해당 리소스를 찾을 수 없습니다.' })
  message!: string;

  @ApiProperty({ example: 'Not Found' })
  error!: string;

  @ApiProperty({
    example: '2026-04-11T12:00:00.000Z',
    format: 'date-time',
  })
  timestamp!: string;

  @ApiProperty({ example: '/classes/class-1' })
  path!: string;
}

export class ValidationErrorResponseDto {
  @ApiProperty({ example: false })
  success!: false;

  @ApiProperty({ example: 400 })
  statusCode!: number;

  @ApiProperty({
    example: ['email must be an email', 'password should not be empty'],
    type: [String],
  })
  message!: string[];

  @ApiProperty({ example: 'Bad Request' })
  error!: string;

  @ApiProperty({
    example: '2026-04-11T12:00:00.000Z',
    format: 'date-time',
  })
  timestamp!: string;

  @ApiProperty({ example: '/auth/login' })
  path!: string;
}
