import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { SubmitSurveyRequestDto } from './dto/submit-survey.request.dto';
import { SurveyResponseDto } from './dto/survey.response.dto';
import { SurveyService } from './survey.service';

@ApiTags('survey')
@Controller('survey')
@UseGuards(JwtAuthGuard)
export class SurveyController {
  constructor(private readonly surveyService: SurveyService) {}

  @Post()
  @ApiOperation({ summary: '수강생 설문 제출' })
  async submitSurvey(
    @CurrentUser() currentUser: JwtPayload,
    @Body() request: SubmitSurveyRequestDto,
  ): Promise<SurveyResponseDto> {
    return this.surveyService.submitSurvey(currentUser, request);
  }

  @Get('me')
  @ApiOperation({ summary: '수강생 내 설문 조회' })
  async getMySurvey(
    @CurrentUser() currentUser: JwtPayload,
  ): Promise<SurveyResponseDto | null> {
    return this.surveyService.getMySurvey(currentUser);
  }
}
