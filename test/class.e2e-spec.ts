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
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { ResponseInterceptor } from '../src/common/interceptors/response.interceptor';

describe('Class (e2e)', () => {
  let app: INestApplication<App>;
  let userRepository: Repository<User>;
  let classroomRepository: Repository<Classroom>;
  const createdEmails: string[] = [];
  const createdTeacherIds: string[] = [];

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
  });

  afterAll(async () => {
    if (createdTeacherIds.length > 0) {
      await classroomRepository.delete({
        teacherId: In(createdTeacherIds),
      });
    }

    if (createdEmails.length > 0) {
      await userRepository.delete({
        email: In(createdEmails),
      });
    }

    await app.close();
  });

  it('교강사가 수업을 만들고 수업 코드를 재발급한 뒤 수강생이 새 코드로 참여할 수 있다', async () => {
    const timestamp = Date.now();
    const teacherEmail = `teacher-class-e2e-${timestamp}@example.com`;
    const studentEmail = `student-class-e2e-${timestamp}@example.com`;
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

    const teacherLoginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: teacherEmail,
        password: 'Password123!',
      })
      .expect(200);

    const teacherAccessToken =
      teacherLoginResponse.body.data.accessToken as string;

    const createClassResponse = await request(app.getHttpServer())
      .post('/classes')
      .set('Authorization', `Bearer ${teacherAccessToken}`)
      .send({
        name: 'Product Studio',
        description: 'Main practice class',
      })
      .expect(201);

    expect(createClassResponse.body.success).toBe(true);
    expect(createClassResponse.body.data.classCode).toMatch(
      /^[A-G0-9]{4}-[A-G0-9]{4}$/,
    );

    const originalClassCode = createClassResponse.body.data.classCode as string;
    const classId = createClassResponse.body.data.classId as string;

    const regenerateCodeResponse = await request(app.getHttpServer())
      .post(`/classes/${classId}/code/regenerate`)
      .set('Authorization', `Bearer ${teacherAccessToken}`)
      .expect(201);

    expect(regenerateCodeResponse.body.success).toBe(true);
    expect(regenerateCodeResponse.body.data.classCode).toMatch(
      /^[A-G0-9]{4}-[A-G0-9]{4}$/,
    );
    expect(regenerateCodeResponse.body.data.classCode).not.toBe(
      originalClassCode,
    );

    const teacher = await userRepository.findOneByOrFail({
      email: teacherEmail,
    });
    createdTeacherIds.push(teacher.userId);

    const studentLoginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: studentEmail,
        password: 'Password123!',
      })
      .expect(200);

    const studentAccessToken =
      studentLoginResponse.body.data.accessToken as string;
    const classCode = regenerateCodeResponse.body.data.classCode as string;

    const joinClassResponse = await request(app.getHttpServer())
      .post('/classes/join')
      .set('Authorization', `Bearer ${studentAccessToken}`)
      .send({
        classCode: ` ${classCode.toLowerCase()} `,
      })
      .expect(201);

    expect(joinClassResponse.body.success).toBe(true);
    expect(joinClassResponse.body.data.classCode).toBe(classCode);

    const studentClassesResponse = await request(app.getHttpServer())
      .get('/classes')
      .set('Authorization', `Bearer ${studentAccessToken}`)
      .expect(200);

    expect(studentClassesResponse.body.success).toBe(true);
    expect(studentClassesResponse.body.data.classes).toEqual([
      expect.objectContaining({
        name: 'Product Studio',
        classCode: null,
        myGroup: null,
      }),
    ]);
  });
});
