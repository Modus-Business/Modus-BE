import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, IsUUID, Length } from 'class-validator';

export class CreateNoticeRequestDto {
  @ApiProperty({ example: '오늘 수업 공지' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @Length(1, 100)
  title!: string;

  @ApiProperty({
    example: '오후 3시까지 초안 제출 후 모둠별 피드백을 진행합니다.',
  })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @Length(1, 2000)
  content!: string;

  @ApiProperty({ example: 'group-1' })
  @IsUUID()
  groupId!: string;
}
