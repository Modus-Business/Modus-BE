import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, Length } from 'class-validator';

export class CreateClassRequestDto {
  @ApiProperty({ example: '프로덕트 스튜디오' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @Length(2, 100)
  name!: string;

  @ApiProperty({
    example: '서비스 구조 설계와 퍼블리싱을 함께 진행하는 메인 실습 수업',
    required: false,
  })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsOptional()
  @IsString()
  @Length(1, 500)
  description?: string;
}
