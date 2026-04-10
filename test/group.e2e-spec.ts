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
import { Group } from '../src/group/entities/group.entity';

describe('Group (e2e)', () => {
  let app: INestApplication<App>;
  let userRepository: Repository<User>;
  let classroomRepository: Repository<Classroom>;
  let groupRepository: Repository<Group>;
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
    groupRepository = app.get<Repository<Group>>(getRepositoryToken(Group));
  });

  afterAll(async () => {
    if (createdClassIds.length > 0) {
      await groupRepository.delete({
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

  it('regenerates a student nickname when the student leaves a group and joins another one', async () => {
    const timestamp = Date.now();
    const teacherEmail = `teacher-group-e2e-${timestamp}@example.com`;
    const studentEmail = `student-group-e2e-${timestamp}@example.com`;
    createdEmails.push(teacherEmail, studentEmail);

    await request(app.getHttpServer())
      .post('/auth/signup')
      .send({
        name: '교강사',
        email: teacherEmail,
        role: UserRole.TEACHER,
        password: 'Password123!',
        passwordConfirmation: 'Password123!',
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/auth/signup')
      .send({
        name: '수강생',
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
        name: '프로덕트 스튜디오',
        description: '메인 실습 수업',
      })
      .expect(201);

    const classId = createClassResponse.body.data.classId as string;
    const classCode = createClassResponse.body.data.classCode as string;
    createdClassIds.push(classId);

    const student = await userRepository.findOneByOrFail({
      email: studentEmail,
    });

    const studentLoginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: studentEmail,
        password: 'Password123!',
      })
      .expect(200);
    const studentAccessToken =
      studentLoginResponse.body.data.accessToken as string;

    await request(app.getHttpServer())
      .post('/classes/join')
      .set('Authorization', `Bearer ${studentAccessToken}`)
      .send({
        classCode,
      })
      .expect(201);

    const createFirstGroupResponse = await request(app.getHttpServer())
      .post('/groups')
      .set('Authorization', `Bearer ${teacherAccessToken}`)
      .send({
        classId,
        name: '모둠 3',
        studentIds: [student.userId],
      })
      .expect(201);

    const firstGroupId = createFirstGroupResponse.body.data.groupId as string;

    const firstGroupDetailResponse = await request(app.getHttpServer())
      .get(`/groups/${firstGroupId}`)
      .set('Authorization', `Bearer ${studentAccessToken}`)
      .expect(200);

    const firstNickname =
      firstGroupDetailResponse.body.data.members[0].displayName as string;

    await request(app.getHttpServer())
      .patch(`/groups/${firstGroupId}`)
      .set('Authorization', `Bearer ${teacherAccessToken}`)
      .send({
        name: '모둠 3',
        studentIds: [],
      })
      .expect(200);

    const emptyMyGroupResponse = await request(app.getHttpServer())
      .get(`/groups/my/${classId}`)
      .set('Authorization', `Bearer ${studentAccessToken}`)
      .expect(200);

    expect(emptyMyGroupResponse.body.data).toEqual({
      hasGroup: false,
      group: null,
      message: '참여 중인 모둠이 없습니다.',
    });

    const createSecondGroupResponse = await request(app.getHttpServer())
      .post('/groups')
      .set('Authorization', `Bearer ${teacherAccessToken}`)
      .send({
        classId,
        name: '모둠 4',
        studentIds: [student.userId],
      })
      .expect(201);

    const secondGroupId = createSecondGroupResponse.body.data.groupId as string;

    const secondGroupDetailResponse = await request(app.getHttpServer())
      .get(`/groups/${secondGroupId}`)
      .set('Authorization', `Bearer ${studentAccessToken}`)
      .expect(200);

    const secondNickname =
      secondGroupDetailResponse.body.data.members[0].displayName as string;

    expect(firstNickname).not.toBe(secondNickname);
  });
});
