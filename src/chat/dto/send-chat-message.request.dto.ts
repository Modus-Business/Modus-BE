import { IsString, Length } from 'class-validator';

export class SendChatMessageRequestDto {
  @IsString()
  @Length(1, 2000)
  content!: string;
}
