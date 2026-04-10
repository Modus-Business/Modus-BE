import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString, Length, Matches } from 'class-validator';

export class CreatePresignedUploadUrlRequestDto {
  @ApiProperty({ example: 'team-result.pdf' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @Length(1, 255)
  fileName!: string;

  @ApiProperty({ example: 'application/pdf' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsString()
  @Length(3, 100)
  contentType!: string;

  @ApiProperty({
    example: 'assignments',
    required: false,
    enum: ['assignments', 'images', 'general'],
  })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsOptional()
  @IsString()
  @IsIn(['assignments', 'images', 'general'])
  purpose?: 'assignments' | 'images' | 'general';
}
