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
import { Group } from '../src/group/entities/group.entity';
import { AssignmentSubmission } from '../src/assignment/entities/assignment-submission.entity';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { ResponseInterceptor } from '../src/common/interceptors/response.interceptor';

describe('Assignment (e2e)', () => {
  let app: INestApplication<App>;
  let userRepository: Repository<User>;
  let classroomRepository: Repository<Classroom>;
  let groupRepository: Repository<Group>;
  let assignmentSubmissionRepository: Repository<AssignmentSubmission>;
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
    assignmentSubmissionRepository = app.get<Repository<AssignmentSubmission>>(
      getRepositoryToken(AssignmentSubmission),
    );
  });

  afterAll(async () => {
    if (createdClassIds.length > 0) {
      const groups = await groupRepository.find({
        where: { classId: In(createdClassIds) },
      });

      if (groups.length > 0) {
        await assignmentSubmissionRepository.delete({
          groupId: In(groups.map((group) => group.groupId)),
        });
      }

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

  it('수강생은 결과물을 제출하고 교강사는 수업 기준 제출 여부를 조회할 수 있다', async () => {
    const timestamp = Date.now();
    const teacherEmail = `teacher-assignment-${timestamp}@example.com`;
    const studentEmail = `student-assignment-${timestamp}@example.com`;
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

    const student = await userRepository.findOneByOrFail({
      email: studentEmail,
    });

    await request(app.getHttpServer())
      .post('/classes/join')
      .set('Authorization', `Bearer ${studentAccessToken}`)
      .send({
        classCode,
      })
      .expect(201);

    const createGroupResponse = await request(app.getHttpServer())
      .post('/groups')
      .set('Authorization', `Bearer ${teacherAccessToken}`)
      .send({
        classId,
        name: 'Group 3',
        studentIds: [student.userId],
      })
      .expect(201);

    const groupId = createGroupResponse.body.data.groupId as string;

    const submitResponse = await request(app.getHttpServer())
      .post('/assignments/submissions')
      .set('Authorization', `Bearer ${studentAccessToken}`)
      .send({
        groupId,
        fileUrl: 'https://storage.example.com/files/result.pdf',
        link: 'https://figma.com/file/example',
      })
      .expect(201);

    expect(submitResponse.body.data.groupId).toBe(groupId);

    const mySubmissionResponse = await request(app.getHttpServer())
      .get(`/assignments/submissions/my/${groupId}`)
      .set('Authorization', `Bearer ${studentAccessToken}`)
      .expect(200);

    expect(mySubmissionResponse.body.data).toEqual(
      expect.objectContaining({
        groupId,
        fileUrl: 'https://storage.example.com/files/result.pdf',
        link: 'https://figma.com/file/example',
      }),
    );

    const classStatusesResponse = await request(app.getHttpServer())
      .get(`/assignments/submissions/class/${classId}`)
      .set('Authorization', `Bearer ${teacherAccessToken}`)
      .expect(200);

    expect(classStatusesResponse.body.data.submissions).toEqual([
      expect.objectContaining({
        groupId,
        groupName: 'Group 3',
        isSubmitted: true,
      }),
    ]);
  });
});
