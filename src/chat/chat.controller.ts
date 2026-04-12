import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { ApiErrorResponses } from '../common/decorators/api-error-responses.decorator';
import { ChatContributionAnalysisRequestDto } from './dto/chat-contribution-analysis.request.dto';
import { ChatContributionAnalysisResponseDto } from './dto/chat-contribution-analysis.response.dto';
import { ChatInterventionAdviceRequestDto } from './dto/chat-intervention-advice.request.dto';
import { ChatInterventionAdviceResponseDto } from './dto/chat-intervention-advice.response.dto';
import { ChatMessageAdviceRequestDto } from './dto/chat-message-advice.request.dto';
import { ChatMessageAdviceResponseDto } from './dto/chat-message-advice.response.dto';
import { ChatService } from './chat.service';

@ApiTags('chat')
@ApiBearerAuth('access-token')
@Controller('chat')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('message-advice')
  @ApiOperation({
    summary: '메시지 전송 전 AI 조언',
    description:
      '전송 예정인 채팅 문장을 검사해 경고 문구, 차단 여부, 부드러운 수정 제안을 반환합니다.',
  })
  @ApiOkResponse({
    type: ChatMessageAdviceResponseDto,
  })
  @ApiErrorResponses([400, 401, 403, 404, 500])
  async getMessageAdvice(
    @CurrentUser() currentUser: JwtPayload,
    @Body() request: ChatMessageAdviceRequestDto,
  ): Promise<ChatMessageAdviceResponseDto> {
    return this.chatService.getMessageAdvice(currentUser, request);
  }

  @Post('intervention-advice')
  @ApiOperation({
    summary: '그룹 대화 AI 개입 조언',
    description:
      '최근 그룹 채팅을 분석해 참여 유도나 논의 심화를 위한 개입이 필요한지와 추천 문구를 반환합니다.',
  })
  @ApiOkResponse({
    type: ChatInterventionAdviceResponseDto,
  })
  @ApiErrorResponses([400, 401, 403, 404, 500])
  async getInterventionAdvice(
    @CurrentUser() currentUser: JwtPayload,
    @Body() request: ChatInterventionAdviceRequestDto,
  ): Promise<ChatInterventionAdviceResponseDto> {
    return this.chatService.getInterventionAdvice(currentUser, request);
  }

  @Post('contribution-analysis')
  @ApiOperation({
    summary: '그룹 대화 기여도 분석',
    description:
      '최근 그룹 채팅을 역할 기반으로 분석해 닉네임별 기여 유형과 근거를 반환합니다.',
  })
  @ApiOkResponse({
    type: ChatContributionAnalysisResponseDto,
  })
  @ApiErrorResponses([400, 401, 403, 404, 500])
  async getContributionAnalysis(
    @CurrentUser() currentUser: JwtPayload,
    @Body() request: ChatContributionAnalysisRequestDto,
  ): Promise<ChatContributionAnalysisResponseDto> {
    return this.chatService.getContributionAnalysis(currentUser, request);
  }
}
