import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import { In, Repository } from 'typeorm';
import { AppModule } from '../src/app.module';
import { UserRole } from '../src/auth/signup/enums/user-role.enum';
import { User } from '../src/auth/signup/entities/user.entity';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { ResponseInterceptor } from '../src/common/interceptors/response.interceptor';
import { EmailSenderService } from '../src/auth/email/email-sender.service';
import { EmailVerification } from '../src/auth/email/entities/email-verification.entity';

describe('Email Verification (e2e)', () => {
  let app: INestApplication<App>;
  let userRepository: Repository<User>;
  let emailVerificationRepository: Repository<EmailVerification>;
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
    emailVerificationRepository = app.get<Repository<EmailVerification>>(
      getRepositoryToken(EmailVerification),
    );
  });

  afterAll(async () => {
    if (createdEmails.length > 0) {
      const users = await userRepository.find({
        where: {
          email: In(createdEmails),
        },
      });

      if (users.length > 0) {
        await emailVerificationRepository.delete({
          userId: In(users.map((user) => user.userId)),
        });
      }

      await userRepository.delete({
        email: In(createdEmails),
      });
    }

    await app.close();
  });

  it(
    'sends and verifies an email code for the logged-in user',
    async () => {
    const timestamp = Date.now();
    const email = `email-verification-${timestamp}@example.com`;
    createdEmails.push(email);

    await request(app.getHttpServer())
      .post('/auth/signup')
      .send({
        name: '이메일인증',
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

    const emailSenderService = app.get(EmailSenderService);
    const sendVerificationCodeSpy = jest
      .spyOn(emailSenderService, 'sendVerificationCode')
      .mockResolvedValue(undefined);

    const sendResponse = await request(app.getHttpServer())
      .post('/auth/email/send-verification')
      .set('Authorization', `Bearer ${accessToken}`)
      .send()
      .expect(200);

    expect(sendResponse.body.success).toBe(true);
    expect(sendVerificationCodeSpy).toHaveBeenCalledTimes(1);

    const user = await userRepository.findOneByOrFail({
      email,
    });
    const emailVerification = await emailVerificationRepository.findOneByOrFail({
      userId: user.userId,
    });

    const verifyResponse = await request(app.getHttpServer())
      .post('/auth/email/verify')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        code: emailVerification.code,
      })
      .expect(200);

    expect(verifyResponse.body.data).toEqual({
      message: '이메일 인증이 완료되었습니다.',
      isEmailVerified: true,
    });

    const verifiedUser = await userRepository.findOneByOrFail({
      email,
    });
    expect(verifiedUser.isEmailVerified).toBe(true);

      sendVerificationCodeSpy.mockRestore();
    },
    30000,
  );
});
