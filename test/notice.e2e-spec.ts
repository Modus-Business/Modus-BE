import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import { In, Repository } from 'typeorm';
import { AppModule } from '../src/app.module';
import { UserRole } from '../src/auth/signup/enums/user-role.enum';
import { User } from '../src/auth/signup/entities/user.entity';
import { Classroom } from '../src/class/entities/class.entity';
import { Notice } from '../src/notice/entities/notice.entity';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { ResponseInterceptor } from '../src/common/interceptors/response.interceptor';

describe('Notice (e2e)', () => {
  let app: INestApplication<App>;
  let userRepository: Repository<User>;
  let classroomRepository: Repository<Classroom>;
  let noticeRepository: Repository<Notice>;
  const createdEmails: string[] = [];
  const createdClassIds: string[] = [];

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
    classroomRepository = app.get<Repository<Classroom>>(
      getRepositoryToken(Classroom),
    );
    noticeRepository = app.get<Repository<Notice>>(getRepositoryToken(Notice));
  });

  afterAll(async () => {
    if (createdClassIds.length > 0) {
      await noticeRepository.delete({
        classId: In(createdClassIds),
      });
      await classroomRepository.delete({
        classId: In(createdClassIds),
      });
    }

    if (createdEmails.length > 0) {
      await userRepository.delete({
        email: In(createdEmails),
      });
    }

    await app.close();
  });

  it('교강사는 공지를 작성, 수정, 삭제할 수 있고 학생은 수업 공지 목록을 조회할 수 있다', async () => {
    const timestamp = Date.now();
    const teacherEmail = `teacher-notice-${timestamp}@example.com`;
    const studentEmail = `student-notice-${timestamp}@example.com`;
    createdEmails.push(teacherEmail, studentEmail);

    await request(app.getHttpServer())
      .post('/auth/signup')
      .send({
        name: 'Teacher',
        email: teacherEmail,
        role: UserRole.TEACHER,
        password: 'Password123!',
        passwordConfirmation: 'Password123!',
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/auth/signup')
      .send({
        name: 'Student',
        email: studentEmail,
        role: UserRole.STUDENT,
        password: 'Password123!',
        passwordConfirmation: 'Password123!',
      })
      .expect(201);

    const teacherLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: teacherEmail,
        password: 'Password123!',
      })
      .expect(200);
    const studentLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: studentEmail,
        password: 'Password123!',
      })
      .expect(200);

    const teacherAccessToken = teacherLogin.body.data.accessToken as string;
    const studentAccessToken = studentLogin.body.data.accessToken as string;

    const createClassResponse = await request(app.getHttpServer())
      .post('/classes')
      .set('Authorization', `Bearer ${teacherAccessToken}`)
      .send({
        name: 'Product Studio',
        description: 'Main practice class',
      })
      .expect(201);

    const classId = createClassResponse.body.data.classId as string;
    const classCode = createClassResponse.body.data.classCode as string;
    createdClassIds.push(classId);

    await request(app.getHttpServer())
      .post('/classes/join')
      .set('Authorization', `Bearer ${studentAccessToken}`)
      .send({
        classCode,
      })
      .expect(201);

    const createNoticeResponse = await request(app.getHttpServer())
      .post('/notices')
      .set('Authorization', `Bearer ${teacherAccessToken}`)
      .send({
        classId,
        title: 'Today Notice',
        content: 'Submit the first draft by 3 PM.',
      })
      .expect(201);

    const noticeId = createNoticeResponse.body.data.noticeId as string;
    expect(createNoticeResponse.body.data.title).toBe('Today Notice');
    expect(createNoticeResponse.body.data.classId).toBe(classId);

    const updateNoticeResponse = await request(app.getHttpServer())
      .patch(`/notices/${noticeId}`)
      .set('Authorization', `Bearer ${teacherAccessToken}`)
      .send({
        title: 'Updated Notice',
        content: 'Submit the updated draft by 4 PM.',
      })
      .expect(200);

    expect(updateNoticeResponse.body.data.title).toBe('Updated Notice');
    expect(updateNoticeResponse.body.data.content).toBe(
      'Submit the updated draft by 4 PM.',
    );

    const noticeListResponse = await request(app.getHttpServer())
      .get(`/notices/class/${classId}`)
      .set('Authorization', `Bearer ${studentAccessToken}`)
      .expect(200);

    expect(noticeListResponse.body.data.notices).toEqual([
      expect.objectContaining({
        classId,
        title: 'Updated Notice',
        content: 'Submit the updated draft by 4 PM.',
      }),
    ]);

    const deleteNoticeResponse = await request(app.getHttpServer())
      .delete(`/notices/${noticeId}`)
      .set('Authorization', `Bearer ${teacherAccessToken}`)
      .expect(200);

    expect(deleteNoticeResponse.body.data.message).toBe('공지사항을 삭제했습니다.');
  });
});
