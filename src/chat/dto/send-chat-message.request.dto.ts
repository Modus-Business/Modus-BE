import { IsString, Length, Matches } from 'class-validator';

export class SendChatMessageRequestDto {
  @IsString()
  @Length(1, 2000)
  @Matches(/\S/, { message: 'content는 공백만 보낼 수 없습니다.' })
  content!: string;
}
