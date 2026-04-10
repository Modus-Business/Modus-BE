import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { UserRole } from '../auth/signup/enums/user-role.enum';
import { SubmitSurveyRequestDto } from './dto/submit-survey.request.dto';
import { SurveyResponseDto } from './dto/survey.response.dto';
import { SurveyService } from './survey.service';

@ApiTags('survey')
@ApiBearerAuth('access-token')
@Controller('survey')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SurveyController {
  constructor(private readonly surveyService: SurveyService) {}

  @Post()
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: '수강생 설문 제출' })
  async submitSurvey(
    @CurrentUser() currentUser: JwtPayload,
    @Body() request: SubmitSurveyRequestDto,
  ): Promise<SurveyResponseDto> {
    return this.surveyService.submitSurvey(currentUser, request);
  }

  @Get('me')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: '수강생 내 설문 조회' })
  async getMySurvey(
    @CurrentUser() currentUser: JwtPayload,
  ): Promise<SurveyResponseDto | null> {
    return this.surveyService.getMySurvey(currentUser);
  }
}
