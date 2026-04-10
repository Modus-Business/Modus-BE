import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, Length, Matches } from 'class-validator';

export class VerifyEmailRequestDto {
  @ApiProperty({ example: 'A1b2C3' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @Length(6, 6)
  @Matches(/^(?=(?:.*[A-Za-z]){3})(?=(?:.*\d){3})[A-Za-z\d]{6}$/)
  code!: string;
}
