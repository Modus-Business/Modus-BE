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

describe('Auth (e2e)', () => {
  let app: INestApplication<App>;
  let userRepository: Repository<User>;
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
  });

  afterAll(async () => {
    if (createdEmails.length > 0) {
      await userRepository.delete({
        email: In(createdEmails),
      });
    }

    await app.close();
  });

  it('회원가입, 로그인, 재발급, 로그아웃이 실제 DB에서 동작한다', async () => {
    const email = `auth-e2e-${Date.now()}@example.com`;
    createdEmails.push(email);

    const signupResponse = await request(app.getHttpServer())
      .post('/auth/signup')
      .send({
        name: '테스트유저',
        email,
        role: UserRole.STUDENT,
        password: 'Password123!',
        passwordConfirmation: 'Password123!',
      })
      .expect(201);

    expect(signupResponse.body.success).toBe(true);
    expect(signupResponse.body.data.email).toBe(email);

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: ` ${email.toUpperCase()} `,
        password: 'Password123!',
      })
      .expect(200);

    expect(loginResponse.body.success).toBe(true);
    expect(loginResponse.body.data.email).toBe(email);
    expect(loginResponse.body.data.accessToken).toEqual(expect.any(String));
    expect(loginResponse.body.data.refreshToken).toEqual(expect.any(String));

    const firstRefreshToken = loginResponse.body.data.refreshToken as string;

    const refreshResponse = await request(app.getHttpServer())
      .post('/auth/login/refresh')
      .send({
        refreshToken: firstRefreshToken,
      })
      .expect(200);

    expect(refreshResponse.body.success).toBe(true);
    expect(refreshResponse.body.data.email).toBe(email);
    expect(refreshResponse.body.data.refreshToken).not.toBe(firstRefreshToken);

    const rotatedRefreshToken = refreshResponse.body.data.refreshToken as string;

    const logoutResponse = await request(app.getHttpServer())
      .post('/auth/logout')
      .send({
        refreshToken: rotatedRefreshToken,
      })
      .expect(200);

    expect(logoutResponse.body.success).toBe(true);
    expect(logoutResponse.body.data.message).toBe('로그아웃되었습니다.');

    const refreshAfterLogoutResponse = await request(app.getHttpServer())
      .post('/auth/login/refresh')
      .send({
        refreshToken: rotatedRefreshToken,
      })
      .expect(401);

    expect(refreshAfterLogoutResponse.body.success).toBe(false);
  });
});
