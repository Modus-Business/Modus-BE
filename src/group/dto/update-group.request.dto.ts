import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  Length,
} from 'class-validator';

export class UpdateGroupRequestDto {
  @ApiProperty({ example: '모둠 4' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @Length(1, 100)
  name!: string;

  @ApiProperty({
    example: ['1f2097a6-bf59-4f11-a5ea-7094be991111'],
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  studentIds?: string[];
}
