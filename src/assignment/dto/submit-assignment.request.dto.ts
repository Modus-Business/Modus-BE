import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, IsUrl, IsUUID, Length } from 'class-validator';

export class SubmitAssignmentRequestDto {
  @ApiProperty({ example: '11111111-1111-1111-1111-111111111111' })
  @IsUUID()
  groupId!: string;

  @ApiProperty({
    example: 'https://storage.example.com/files/result.pdf',
    required: false,
    nullable: true,
  })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsOptional()
  @IsString()
  @Length(1, 2000)
  @IsUrl(
    { require_tld: false },
    { message: 'fileUrl must be a valid URL' },
  )
  fileUrl?: string;

  @ApiProperty({
    example: 'https://figma.com/file/example',
    required: false,
    nullable: true,
  })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsOptional()
  @IsString()
  @Length(1, 2000)
  @IsUrl({ require_tld: false }, { message: 'link must be a valid URL' })
  link?: string;
}
