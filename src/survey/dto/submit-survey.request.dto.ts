import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, Length, Matches } from 'class-validator';

export class SubmitSurveyRequestDto {
  @ApiProperty({ example: 'INTJ', required: false, nullable: true })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @IsOptional()
  @IsString()
  @Matches(/^[EI][NS][TF][JP]$/)
  mbti?: string;

  @ApiProperty({
    example: '계획적으로 움직이는 편이고 역할이 분명한 협업을 선호합니다.',
    required: false,
    nullable: true,
  })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsOptional()
  @IsString()
  @Length(1, 1000)
  personality?: string;

  @ApiProperty({
    example: '정리된 문서 협업과 일정 기반 진행을 선호합니다.',
    required: false,
    nullable: true,
  })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsOptional()
  @IsString()
  @Length(1, 1000)
  preference?: string;
}
