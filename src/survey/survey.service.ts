import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { UserRole } from '../auth/signup/enums/user-role.enum';
import { SubmitSurveyRequestDto } from './dto/submit-survey.request.dto';
import { SurveyResponseDto } from './dto/survey.response.dto';
import { Survey } from './entities/survey.entity';

@Injectable()
export class SurveyService {
  constructor(
    @InjectRepository(Survey)
    private readonly surveyRepository: Repository<Survey>,
  ) {}

  async submitSurvey(
    currentUser: JwtPayload,
    request: SubmitSurveyRequestDto,
  ): Promise<SurveyResponseDto> {
    this.ensureStudent(currentUser);

    if (!request.mbti && !request.personality && !request.preference) {
      throw new BadRequestException(
        'mbti, personality, preference 중 하나는 반드시 제출해야 합니다.',
      );
    }

    let survey = await this.surveyRepository.findOne({
      where: {
        userId: currentUser.sub,
      },
    });

    if (!survey) {
      survey = this.surveyRepository.create({
        userId: currentUser.sub,
        mbti: request.mbti ?? null,
        personality: request.personality ?? null,
        preference: request.preference ?? null,
      });
    } else {
      survey.mbti = request.mbti ?? null;
      survey.personality = request.personality ?? null;
      survey.preference = request.preference ?? null;
    }

    const savedSurvey = await this.surveyRepository.save(survey);

    return this.toSurveyResponse(savedSurvey);
  }

  async getMySurvey(
    currentUser: JwtPayload,
  ): Promise<SurveyResponseDto | null> {
    this.ensureStudent(currentUser);

    const survey = await this.surveyRepository.findOne({
      where: {
        userId: currentUser.sub,
      },
    });

    return survey ? this.toSurveyResponse(survey) : null;
  }

  private ensureStudent(currentUser: JwtPayload): void {
    if (currentUser.role !== UserRole.STUDENT) {
      throw new ForbiddenException('수강생만 설문을 제출하거나 조회할 수 있습니다.');
    }
  }

  private toSurveyResponse(survey: Survey): SurveyResponseDto {
    return {
      surveyId: survey.surveyId,
      userId: survey.userId,
      mbti: survey.mbti,
      personality: survey.personality,
      preference: survey.preference,
      createdAt: survey.createdAt,
      updatedAt: survey.updatedAt,
    };
  }
}
