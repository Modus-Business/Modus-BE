import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiExtraModels,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { UserRole } from '../auth/signup/enums/user-role.enum';
import { SubmitSurveyRequestDto } from './dto/submit-survey.request.dto';
import { GetMySurveySuccessResponseDto } from './dto/survey-get.response.dto';
import { SurveyResponseDto } from './dto/survey.response.dto';
import { SurveyService } from './survey.service';

@ApiTags('survey')
@ApiExtraModels(SurveyResponseDto, GetMySurveySuccessResponseDto)
@ApiBearerAuth('access-token')
@Controller('survey')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SurveyController {
  constructor(private readonly surveyService: SurveyService) {}

  @Post()
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: '학생용 설문 제출' })
  async submitSurvey(
    @CurrentUser() currentUser: JwtPayload,
    @Body() request: SubmitSurveyRequestDto,
  ): Promise<SurveyResponseDto> {
    return this.surveyService.submitSurvey(currentUser, request);
  }

  @Get('me')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: '학생용 내 설문 조회' })
  @ApiOkResponse({
    description: '현재 로그인한 학생의 설문 데이터를 반환합니다.',
    type: GetMySurveySuccessResponseDto,
  })
  async getMySurvey(
    @CurrentUser() currentUser: JwtPayload,
  ): Promise<SurveyResponseDto | null> {
    return this.surveyService.getMySurvey(currentUser);
  }
}
