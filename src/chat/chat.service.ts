import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { UserRole } from '../auth/signup/enums/user-role.enum';
import { GroupService } from '../group/group.service';
import type { GeneratedContributionAnalysis } from '../openai/openai.service';
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
const MESSAGE_ADVICE_RECENT_LIMIT = 3;
const INTERVENTION_RECENT_LIMIT = 8;
const CONTRIBUTION_RECENT_LIMIT = 12;
const MESSAGE_ADVICE_CACHE_TTL_MS = 15_000;
const ANALYSIS_CACHE_TTL_MS = 180_000;
const AI_RATE_LIMIT_BUCKETS = {
  messageAdvice: { windowMs: 30_000, maxRequests: 8 },
  interventionAdvice: { windowMs: 60_000, maxRequests: 6 },
  contributionAnalysis: { windowMs: 60_000, maxRequests: 4 },
} as const;

type AiCacheEntry<T> = {
  expiresAt: number;
  fingerprint: string;
  value: T;
};

@Injectable()
export class ChatService {
  private readonly aiRequestHistory = new Map<string, number[]>();
  private readonly messageAdviceCache = new Map<
    string,
    AiCacheEntry<ChatMessageAdviceResponseDto>
  >();
  private readonly interventionAdviceCache = new Map<
    string,
    AiCacheEntry<ChatInterventionAdviceResponseDto>
  >();
  private readonly contributionAnalysisCache = new Map<
    string,
    AiCacheEntry<ChatContributionAnalysisResponseDto>
  >();

  constructor(
    @InjectRepository(ChatMessage)
    private readonly chatMessageRepository: Repository<ChatMessage>,
    private readonly groupService: GroupService,
    private readonly openAiService: OpenAiService,
  ) {}

  async getRecentMessages(groupId: string): Promise<ChatMessageResponseDto[]> {
    const messages = await this.chatMessageRepository.find({
      where: { groupId },
      order: { sentAt: 'DESC' },
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
    const trimmedContent = request.content.trim();

    if (!trimmedContent) {
      throw new BadRequestException('content는 공백만 보낼 수 없습니다.');
    }

    this.enforceAiRateLimit(
      `message-advice:${currentUser.sub}:${request.groupId}`,
      AI_RATE_LIMIT_BUCKETS.messageAdvice,
    );

    const participant = await this.groupService.getChatParticipantInfo(
      currentUser,
      request.groupId,
    );
    const recentMessages = await this.chatMessageRepository.find({
      where: { groupId: participant.groupId },
      order: { sentAt: 'DESC' },
      take: MESSAGE_ADVICE_RECENT_LIMIT,
    });
    const normalizedMessages = recentMessages.reverse();
    const cacheKey = `message:${currentUser.sub}:${participant.groupId}`;
    const fingerprint = JSON.stringify({
      content: trimmedContent,
      recentMessageIds: normalizedMessages.map((message) => message.messageId),
      recentMessageContents: normalizedMessages.map((message) => message.content),
    });
    const cachedAdvice = this.getCachedResponse(
      this.messageAdviceCache,
      cacheKey,
      fingerprint,
    );

    if (cachedAdvice) {
      return cachedAdvice;
    }

    const advice = await this.openAiService.generateMessageAdvice({
      content: trimmedContent,
      recentMessages: normalizedMessages.map(
        (message) => `${message.nickname}: ${message.content}`,
      ),
    });
    const response = {
      groupId: participant.groupId,
      riskLevel: advice.riskLevel,
      riskLevelLabel: this.toRiskLevelLabel(advice.riskLevel),
      shouldBlock: advice.shouldBlock,
      shouldShowPopup: advice.shouldBlock || advice.riskLevel === 'high',
      shouldSkip: advice.riskLevel === 'low' && advice.shouldBlock === false,
      warning: advice.warning,
      suggestedRewrite: advice.suggestedRewrite,
    };

    this.setCachedResponse(
      this.messageAdviceCache,
      cacheKey,
      fingerprint,
      response,
      MESSAGE_ADVICE_CACHE_TTL_MS,
    );

    return response;
  }

  async getInterventionAdvice(
    currentUser: JwtPayload,
    request: ChatInterventionAdviceRequestDto,
  ): Promise<ChatInterventionAdviceResponseDto> {
    this.enforceAiRateLimit(
      `intervention-advice:${currentUser.sub}:${request.groupId}`,
      AI_RATE_LIMIT_BUCKETS.interventionAdvice,
    );

    const roster = await this.groupService.getGroupAnalysisRoster(
      currentUser,
      request.groupId,
    );
    const recentMessages = await this.chatMessageRepository.find({
      where: { groupId: roster.groupId },
      order: { sentAt: 'DESC' },
      take: INTERVENTION_RECENT_LIMIT,
    });
    const normalizedMessages = recentMessages.reverse();
    const participantMessageCounts = this.buildParticipantMessageCounts(
      roster.participantNicknames,
      normalizedMessages,
    );
    const cacheKey = `intervention:${roster.groupId}`;
    const fingerprint = JSON.stringify({
      participantNicknames: roster.participantNicknames,
      recentMessageIds: normalizedMessages.map((message) => message.messageId),
      recentMessageContents: normalizedMessages.map((message) => message.content),
    });
    const cachedAdvice = this.getCachedResponse(
      this.interventionAdviceCache,
      cacheKey,
      fingerprint,
    );

    if (cachedAdvice) {
      return cachedAdvice;
    }

    const advice = await this.openAiService.generateInterventionAdvice({
      recentMessages: normalizedMessages.map(
        (message) => `${message.nickname}: ${message.content}`,
      ),
      participantNicknames: roster.participantNicknames,
      participantMessageCounts,
    });
    const response = {
      groupId: roster.groupId,
      interventionNeeded: advice.interventionNeeded,
      interventionType: advice.interventionType,
      reason: advice.reason,
      suggestedMessage: advice.suggestedMessage,
    };

    this.setCachedResponse(
      this.interventionAdviceCache,
      cacheKey,
      fingerprint,
      response,
      ANALYSIS_CACHE_TTL_MS,
    );

    return response;
  }

  async getContributionAnalysis(
    currentUser: JwtPayload,
    request: ChatContributionAnalysisRequestDto,
  ): Promise<ChatContributionAnalysisResponseDto> {
    if (currentUser.role !== UserRole.TEACHER) {
      throw new ForbiddenException('교강사만 기여도 분석을 조회할 수 있습니다.');
    }

    this.enforceAiRateLimit(
      `contribution-analysis:${currentUser.sub}:${request.groupId}`,
      AI_RATE_LIMIT_BUCKETS.contributionAnalysis,
    );

    const roster = await this.groupService.getTeacherContributionRoster(
      currentUser,
      request.groupId,
    );
    const recentMessages = await this.chatMessageRepository.find({
      where: { groupId: roster.groupId },
      order: { sentAt: 'DESC' },
      take: CONTRIBUTION_RECENT_LIMIT,
    });
    const normalizedMessages = recentMessages.reverse();
    const participantMessageCounts = this.buildParticipantMessageCounts(
      roster.participantNicknames,
      normalizedMessages,
    );
    const cacheKey = `contribution:${roster.groupId}`;
    const fingerprint = JSON.stringify({
      participantNicknames: roster.participantNicknames,
      recentMessageIds: normalizedMessages.map((message) => message.messageId),
      recentMessageContents: normalizedMessages.map((message) => message.content),
    });
    const cachedAnalysis = this.getCachedResponse(
      this.contributionAnalysisCache,
      cacheKey,
      fingerprint,
    );

    if (cachedAnalysis) {
      return cachedAnalysis;
    }

    const analysis = await this.openAiService.generateContributionAnalysis({
      recentMessages: normalizedMessages.map(
        (message) => `${message.nickname}: ${message.content}`,
      ),
      participantNicknames: roster.participantNicknames,
      participantMessageCounts,
    });
    const response = {
      groupId: roster.groupId,
      summary: analysis.summary,
      members: this.mergeContributionMembers(
        roster.participantNicknames,
        analysis,
      ).map(
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

    this.setCachedResponse(
      this.contributionAnalysisCache,
      cacheKey,
      fingerprint,
      response,
      ANALYSIS_CACHE_TTL_MS,
    );

    return response;
  }

  private buildParticipantMessageCounts(
    participantNicknames: string[],
    messages: ChatMessage[],
  ): Record<string, number> {
    const counts = Object.fromEntries(
      participantNicknames.map((nickname) => [nickname, 0]),
    ) as Record<string, number>;

    for (const message of messages) {
      counts[message.nickname] = (counts[message.nickname] ?? 0) + 1;
    }

    return counts;
  }

  private mergeContributionMembers(
    participantNicknames: string[],
    analysis: GeneratedContributionAnalysis,
  ): GeneratedContributionAnalysis['members'] {
    const analysisByNickname = new Map(
      analysis.members.map((member) => [member.nickname, member]),
    );

    return participantNicknames.map((nickname) => {
      const analyzedMember = analysisByNickname.get(nickname);

      if (analyzedMember) {
        return analyzedMember;
      }

      return {
        nickname,
        contributionScore: 0,
        contributionTypes: [],
        reason:
          '최근 대화에서 뚜렷한 기여 근거가 적었습니다. 더 많은 발화와 역할 참여가 필요합니다.',
      };
    });
  }

  private enforceAiRateLimit(
    key: string,
    limits: { windowMs: number; maxRequests: number },
  ): void {
    const now = Date.now();
    const history = this.aiRequestHistory.get(key) ?? [];
    const recentHistory = history.filter(
      (timestamp) => now - timestamp < limits.windowMs,
    );

    if (recentHistory.length >= limits.maxRequests) {
      throw new HttpException(
        'AI 요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    recentHistory.push(now);
    this.aiRequestHistory.set(key, recentHistory);
  }

  private getCachedResponse<T>(
    cache: Map<string, AiCacheEntry<T>>,
    key: string,
    fingerprint: string,
  ): T | null {
    const cachedEntry = cache.get(key);

    if (!cachedEntry) {
      return null;
    }

    if (cachedEntry.expiresAt <= Date.now()) {
      cache.delete(key);
      return null;
    }

    if (cachedEntry.fingerprint !== fingerprint) {
      return null;
    }

    return cachedEntry.value;
  }

  private setCachedResponse<T>(
    cache: Map<string, AiCacheEntry<T>>,
    key: string,
    fingerprint: string,
    value: T,
    ttlMs: number,
  ): void {
    cache.set(key, {
      fingerprint,
      value,
      expiresAt: Date.now() + ttlMs,
    });
  }

  private toContributionLevel(score: number): 'high' | 'medium' | 'low' {
    if (score >= 70) {
      return 'high';
    }

    if (score >= 40) {
      return 'medium';
    }

    return 'low';
  }

  private toRiskLevelLabel(
    riskLevel: 'low' | 'medium' | 'high',
  ): '낮음' | '중간' | '높음' {
    if (riskLevel === 'high') {
      return '높음';
    }

    if (riskLevel === 'medium') {
      return '중간';
    }

    return '낮음';
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
