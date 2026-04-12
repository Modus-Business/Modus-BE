import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { GroupService } from '../group/group.service';
import { OpenAiService } from '../openai/openai.service';
import { ChatContributionAnalysisRequestDto } from './dto/chat-contribution-analysis.request.dto';
import {
  ChatContributionAnalysisResponseDto,
  ChatContributionMemberDto,
} from './dto/chat-contribution-analysis.response.dto';
import { ChatInterventionAdviceRequestDto } from './dto/chat-intervention-advice.request.dto';
import { ChatInterventionAdviceResponseDto } from './dto/chat-intervention-advice.response.dto';
import { ChatMessageAdviceRequestDto } from './dto/chat-message-advice.request.dto';
import { ChatMessageAdviceResponseDto } from './dto/chat-message-advice.response.dto';
import { ChatMessageResponseDto } from './dto/chat-message.response.dto';
import { ChatMessage } from './entities/chat-message.entity';

const CHAT_HISTORY_LIMIT = 50;

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatMessage)
    private readonly chatMessageRepository: Repository<ChatMessage>,
    private readonly groupService: GroupService,
    private readonly openAiService: OpenAiService,
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

  async getMessageAdvice(
    currentUser: JwtPayload,
    request: ChatMessageAdviceRequestDto,
  ): Promise<ChatMessageAdviceResponseDto> {
    const participant = await this.groupService.getChatParticipantInfo(
      currentUser,
      request.groupId,
    );
    const recentMessages = await this.chatMessageRepository.find({
      where: {
        groupId: participant.groupId,
      },
      order: {
        sentAt: 'DESC',
      },
      take: 5,
    });
    const advice = await this.openAiService.generateMessageAdvice({
      content: request.content.trim(),
      recentMessages: recentMessages
        .reverse()
        .map((message) => `${message.nickname}: ${message.content}`),
    });

    return {
      groupId: participant.groupId,
      riskLevel: advice.riskLevel,
      shouldBlock: advice.shouldBlock,
      warning: advice.warning,
      suggestedRewrite: advice.suggestedRewrite,
    };
  }

  async getInterventionAdvice(
    currentUser: JwtPayload,
    request: ChatInterventionAdviceRequestDto,
  ): Promise<ChatInterventionAdviceResponseDto> {
    const participant = await this.groupService.getChatParticipantInfo(
      currentUser,
      request.groupId,
    );
    const recentMessages = await this.chatMessageRepository.find({
      where: {
        groupId: participant.groupId,
      },
      order: {
        sentAt: 'DESC',
      },
      take: 20,
    });
    const normalizedMessages = recentMessages.reverse();
    const participantMessageCounts = normalizedMessages.reduce<Record<string, number>>(
      (acc, message) => {
        acc[message.nickname] = (acc[message.nickname] ?? 0) + 1;
        return acc;
      },
      {},
    );
    const advice = await this.openAiService.generateInterventionAdvice({
      recentMessages: normalizedMessages.map(
        (message) => `${message.nickname}: ${message.content}`,
      ),
      participantMessageCounts,
    });

    return {
      groupId: participant.groupId,
      interventionNeeded: advice.interventionNeeded,
      interventionType: advice.interventionType,
      reason: advice.reason,
      suggestedMessage: advice.suggestedMessage,
    };
  }

  async getContributionAnalysis(
    currentUser: JwtPayload,
    request: ChatContributionAnalysisRequestDto,
  ): Promise<ChatContributionAnalysisResponseDto> {
    const participant = await this.groupService.getChatParticipantInfo(
      currentUser,
      request.groupId,
    );
    const recentMessages = await this.chatMessageRepository.find({
      where: {
        groupId: participant.groupId,
      },
      order: {
        sentAt: 'DESC',
      },
      take: 30,
    });
    const normalizedMessages = recentMessages.reverse();
    const participantMessageCounts = normalizedMessages.reduce<Record<string, number>>(
      (acc, message) => {
        acc[message.nickname] = (acc[message.nickname] ?? 0) + 1;
        return acc;
      },
      {},
    );
    const analysis = await this.openAiService.generateContributionAnalysis({
      recentMessages: normalizedMessages.map(
        (message) => `${message.nickname}: ${message.content}`,
      ),
      participantMessageCounts,
    });

    return {
      groupId: participant.groupId,
      summary: analysis.summary,
      members: analysis.members.map(
        (member): ChatContributionMemberDto => ({
          nickname: member.nickname,
          contributionScore: member.contributionScore,
          contributionLevel: this.toContributionLevel(
            member.contributionScore,
          ),
          contributionTypes: member.contributionTypes,
          reason: member.reason,
        }),
      ),
    };
  }

  private toContributionLevel(
    score: number,
  ): 'high' | 'medium' | 'low' {
    if (score >= 70) {
      return 'high';
    }

    if (score >= 40) {
      return 'medium';
    }

    return 'low';
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
