import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, Matches } from 'class-validator';

export class JoinClassRequestDto {
  @ApiProperty({ example: 'AB12-CD34' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @IsString()
  @Matches(/^[A-G0-9]{4}-[A-G0-9]{4}$/)
  classCode!: string;
}
