import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatMessageResponseDto } from './dto/chat-message.response.dto';
import { ChatMessage } from './entities/chat-message.entity';

const CHAT_HISTORY_LIMIT = 50;

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatMessage)
    private readonly chatMessageRepository: Repository<ChatMessage>,
  ) {}

  async getRecentMessages(groupId: string): Promise<ChatMessageResponseDto[]> {
    const messages = await this.chatMessageRepository.find({
      where: {
        groupId,
      },
      order: {
        sentAt: 'DESC',
      },
      take: CHAT_HISTORY_LIMIT,
    });

    return messages.reverse().map((message) => this.toResponse(message));
  }

  async createMessage(
    groupId: string,
    senderUserId: string,
    nickname: string,
    content: string,
  ): Promise<ChatMessageResponseDto> {
    const trimmedContent = content.trim();

    if (!trimmedContent) {
      throw new BadRequestException('content는 공백만 보낼 수 없습니다.');
    }

    const message = this.chatMessageRepository.create({
      groupId,
      senderUserId,
      nickname: nickname.trim(),
      content: trimmedContent,
    });
    const savedMessage = await this.chatMessageRepository.save(message);

    return this.toResponse(savedMessage);
  }

  private toResponse(message: ChatMessage): ChatMessageResponseDto {
    return {
      messageId: message.messageId,
      groupId: message.groupId,
      nickname: message.nickname,
      content: message.content,
      sentAt: message.sentAt.toISOString(),
    };
  }
}
