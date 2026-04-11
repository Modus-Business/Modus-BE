import { ApiProperty } from '@nestjs/swagger';

export class RootDataResponseDto {
  @ApiProperty({ example: 'Hello World!' })
  message!: string;
}

export class GetRootSuccessResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: 200 })
  statusCode!: number;

  @ApiProperty({
    type: RootDataResponseDto,
    example: {
      message: 'Hello World!',
    },
  })
  data!: RootDataResponseDto;

  @ApiProperty({ example: '2026-04-11T12:00:00.000Z' })
  timestamp!: string;

  @ApiProperty({ example: '/' })
  path!: string;
}
