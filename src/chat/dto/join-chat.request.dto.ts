import { IsUUID } from 'class-validator';

export class JoinChatRequestDto {
  @IsUUID()
  groupId!: string;
}
