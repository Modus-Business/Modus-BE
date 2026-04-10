import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import { In, Repository } from 'typeorm';
import { AppModule } from '../src/app.module';
import { UserRole } from '../src/auth/signup/enums/user-role.enum';
import { User } from '../src/auth/signup/entities/user.entity';
import { Survey } from '../src/survey/entities/survey.entity';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { ResponseInterceptor } from '../src/common/interceptors/response.interceptor';

describe('Survey (e2e)', () => {
  let app: INestApplication<App>;
  let userRepository: Repository<User>;
  let surveyRepository: Repository<Survey>;
  const createdEmails: string[] = [];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    app.useGlobalInterceptors(new ResponseInterceptor());
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();

    userRepository = app.get<Repository<User>>(getRepositoryToken(User));
    surveyRepository = app.get<Repository<Survey>>(getRepositoryToken(Survey));
  });

  afterAll(async () => {
    if (createdEmails.length > 0) {
      const users = await userRepository.find({
        where: {
          email: In(createdEmails),
        },
      });

      if (users.length > 0) {
        await surveyRepository.delete({
          userId: In(users.map((user) => user.userId)),
        });
      }

      await userRepository.delete({
        email: In(createdEmails),
      });
    }

    await app.close();
  });

  it('수강생은 설문을 제출하고 내 설문을 조회할 수 있다', async () => {
    const email = `survey-student-${Date.now()}@example.com`;
    createdEmails.push(email);

    await request(app.getHttpServer())
      .post('/auth/signup')
      .send({
        name: 'Student',
        email,
        role: UserRole.STUDENT,
        password: 'Password123!',
        passwordConfirmation: 'Password123!',
      })
      .expect(201);

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email,
        password: 'Password123!',
      })
      .expect(200);

    const accessToken = loginResponse.body.data.accessToken as string;

    const submitResponse = await request(app.getHttpServer())
      .post('/survey')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        mbti: 'intj',
        personality: '계획적인 편입니다.',
        preference: '정리된 협업을 선호합니다.',
      })
      .expect(201);

    expect(submitResponse.body.data.mbti).toBe('INTJ');

    const mySurveyResponse = await request(app.getHttpServer())
      .get('/survey/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(mySurveyResponse.body.data).toEqual(
      expect.objectContaining({
        mbti: 'INTJ',
        personality: '계획적인 편입니다.',
        preference: '정리된 협업을 선호합니다.',
      }),
    );
  });
});
