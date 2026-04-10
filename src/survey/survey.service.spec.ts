import {
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRole } from '../auth/signup/enums/user-role.enum';
import { SurveyService } from './survey.service';
import { Survey } from './entities/survey.entity';

describe('SurveyService', () => {
  let surveyService: SurveyService;
  let surveyRepository: jest.Mocked<Repository<Survey>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SurveyService,
        {
          provide: getRepositoryToken(Survey),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    surveyService = module.get<SurveyService>(SurveyService);
    surveyRepository = module.get(getRepositoryToken(Survey));
  });

  it('수강생은 설문을 제출할 수 있다', async () => {
    surveyRepository.findOne.mockResolvedValue(null);
    surveyRepository.create.mockImplementation((input) => input as Survey);
    surveyRepository.save.mockResolvedValue({
      surveyId: 'survey-1',
      userId: 'student-1',
      mbti: 'INTJ',
      personality: '계획적인 편입니다.',
      preference: '정리된 협업을 좋아합니다.',
      createdAt: new Date('2026-04-10T12:00:00.000Z'),
      updatedAt: new Date('2026-04-10T12:00:00.000Z'),
      user: undefined as never,
    } as Survey);

    const result = await surveyService.submitSurvey(
      {
        sub: 'student-1',
        email: 'student@example.com',
        role: UserRole.STUDENT,
      },
      {
        mbti: 'INTJ',
        personality: '계획적인 편입니다.',
        preference: '정리된 협업을 좋아합니다.',
      },
    );

    expect(result.mbti).toBe('INTJ');
  });

  it('설문 필드가 모두 비어 있으면 BadRequestException을 던진다', async () => {
    await expect(
      surveyService.submitSurvey(
        {
          sub: 'student-1',
          email: 'student@example.com',
          role: UserRole.STUDENT,
        },
        {},
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('수강생은 내 설문을 조회할 수 있다', async () => {
    surveyRepository.findOne.mockResolvedValue({
      surveyId: 'survey-1',
      userId: 'student-1',
      mbti: 'INTJ',
      personality: '계획적인 편입니다.',
      preference: '정리된 협업을 좋아합니다.',
      createdAt: new Date('2026-04-10T12:00:00.000Z'),
      updatedAt: new Date('2026-04-10T12:00:00.000Z'),
      user: undefined as never,
    } as Survey);

    const result = await surveyService.getMySurvey({
      sub: 'student-1',
      email: 'student@example.com',
      role: UserRole.STUDENT,
    });

    expect(result?.surveyId).toBe('survey-1');
  });

  it('교강사는 설문에 접근할 수 없다', async () => {
    await expect(
      surveyService.getMySurvey({
        sub: 'teacher-1',
        email: 'teacher@example.com',
        role: UserRole.TEACHER,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
