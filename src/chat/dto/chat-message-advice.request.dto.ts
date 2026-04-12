import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, IsUUID, Length, Matches } from 'class-validator';

export class ChatMessageAdviceRequestDto {
  @ApiProperty({ example: '2b7d2450-0035-4fe3-b7d0-6d60317ba25d' })
  @IsUUID()
  groupId!: string;

  @ApiProperty({ example: '저번에 정리 안 한 건 좀 별로였어요.' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(1, 2000)
  @Matches(/\S/, { message: 'content는 공백만 보낼 수 없습니다.' })
  content!: string;
}
