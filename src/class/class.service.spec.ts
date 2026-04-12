import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRole } from '../auth/signup/enums/user-role.enum';
import { Group } from '../group/entities/group.entity';
import { ClassService } from './class.service';
import { CreateClassRequestDto } from './dto/create-class.request.dto';
import { JoinClassRequestDto } from './dto/join-class.request.dto';
import { ClassParticipant } from './entities/class-participant.entity';
import { Classroom } from './entities/class.entity';

describe('ClassService', () => {
  let classService: ClassService;
  let classroomRepository: jest.Mocked<Repository<Classroom>>;
  let classParticipantRepository: jest.Mocked<Repository<ClassParticipant>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClassService,
        {
          provide: getRepositoryToken(Classroom),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(ClassParticipant),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    classService = module.get<ClassService>(ClassService);
    classroomRepository = module.get(getRepositoryToken(Classroom));
    classParticipantRepository = module.get(getRepositoryToken(ClassParticipant));
  });

  it('수강생 메인 수업 목록과 내가 속한 모둠 정보를 반환한다', async () => {
    classParticipantRepository.find.mockResolvedValue([
      {
        classParticipantId: 'participant-1',
        classId: 'class-1',
        studentId: 'student-1',
        joinedAt: new Date(),
        classroom: {
          classId: 'class-1',
          teacherId: 'teacher-1',
          name: '프로덕트 스튜디오',
          description: '메인 실습 수업',
          classCode: 'AB12-CD34',
          createdAt: new Date('2026-04-10T12:00:00.000Z'),
          updatedAt: new Date(),
          classParticipants: [],
          groups: [],
        },
        student: undefined as never,
        groupMember: {
          groupMemberId: 'group-member-1',
          groupId: 'group-1',
          classParticipantId: 'participant-1',
          joinedAt: new Date(),
          group: {
            groupId: 'group-1',
            classId: 'class-1',
            name: '모둠 3',
            createdAt: new Date(),
            updatedAt: new Date(),
            classroom: undefined as never,
            groupMembers: [],
          },
          classParticipant: undefined as never,
          groupNickname: null,
        },
      } as unknown as ClassParticipant,
    ]);

    const result = await classService.getClasses({
      sub: 'student-1',
      email: 'student@example.com',
      role: UserRole.STUDENT,
    });

    expect(result).toEqual({
      classes: [
        {
          classId: 'class-1',
          name: '프로덕트 스튜디오',
          description: '메인 실습 수업',
          classCode: null,
          studentCount: null,
          createdAt: new Date('2026-04-10T12:00:00.000Z'),
          myGroup: {
            groupId: 'group-1',
            name: '모둠 3',
          },
        },
      ],
    });
  });

  it('교강사 메인 수업 목록에는 수업 코드와 학생 수가 포함된다', async () => {
    classroomRepository.find.mockResolvedValue([
      {
        classId: 'class-1',
        teacherId: 'teacher-1',
        name: '프로덕트 스튜디오',
        description: '메인 실습 수업',
        classCode: 'AB12-CD34',
        createdAt: new Date('2026-04-10T12:00:00.000Z'),
        updatedAt: new Date(),
        classParticipants: [{}, {}] as ClassParticipant[],
        groups: [],
      } as Classroom,
    ]);

    const result = await classService.getClasses({
      sub: 'teacher-1',
      email: 'teacher@example.com',
      role: UserRole.TEACHER,
    });

    expect(result).toEqual({
      classes: [
        {
          classId: 'class-1',
          name: '프로덕트 스튜디오',
          description: '메인 실습 수업',
          classCode: 'AB12-CD34',
          studentCount: 2,
          createdAt: new Date('2026-04-10T12:00:00.000Z'),
          myGroup: null,
        },
      ],
    });
  });

  it('교강사는 수업을 생성할 수 있다', async () => {
    const request: CreateClassRequestDto = {
      name: '프로덕트 스튜디오',
      description: '메인 실습 수업',
    };
    const createdAt = new Date('2026-04-10T12:00:00.000Z');
    const createdClassroom: Classroom = {
      classId: 'class-1',
      teacherId: 'teacher-1',
      name: '프로덕트 스튜디오',
      description: '메인 실습 수업',
      classCode: 'AB12-CD34',
      createdAt,
      updatedAt: createdAt,
      classParticipants: [],
      groups: [],
    };

    classroomRepository.findOne.mockResolvedValue(null);
    classroomRepository.create.mockImplementation((input) => input as Classroom);
    classroomRepository.save.mockResolvedValue(createdClassroom);

    const result = await classService.createClass(
      {
        sub: 'teacher-1',
        email: 'teacher@example.com',
        role: UserRole.TEACHER,
      },
      request,
    );

    expect(result.classId).toBe('class-1');
    expect(result.name).toBe('프로덕트 스튜디오');
    expect(result.description).toBe('메인 실습 수업');
    expect(result.studentCount).toBe(0);
    expect(result.classCode).toMatch(/^[A-G0-9]{4}-[A-G0-9]{4}$/);
    expect(result.createdAt).toEqual(createdAt);
  });

  it('교강사는 본인 수업 코드를 재발급할 수 있다', async () => {
    const originalUpdatedAt = new Date('2026-04-10T12:00:00.000Z');
    const updatedAt = new Date('2026-04-10T13:00:00.000Z');

    classroomRepository.findOne
      .mockResolvedValueOnce({
        classId: 'class-1',
        teacherId: 'teacher-1',
        name: '프로덕트 스튜디오',
        description: '메인 실습 수업',
        classCode: 'AB12-CD34',
        createdAt: originalUpdatedAt,
        updatedAt: originalUpdatedAt,
        classParticipants: [],
        groups: [],
      } as Classroom)
      .mockResolvedValueOnce(null);
    classroomRepository.save.mockImplementation(async (input) => ({
      ...(input as Classroom),
      updatedAt,
    }));

    const result = await classService.regenerateClassCode(
      {
        sub: 'teacher-1',
        email: 'teacher@example.com',
        role: UserRole.TEACHER,
      },
      'class-1',
    );

    expect(result.classId).toBe('class-1');
    expect(result.classCode).toMatch(/^[A-G0-9]{4}-[A-G0-9]{4}$/);
    expect(result.classCode).not.toBe('AB12-CD34');
    expect(result.updatedAt).toEqual(updatedAt);
  });

  it('수강생이 수업 생성 요청을 보내면 ForbiddenException이 발생한다', async () => {
    await expect(
      classService.createClass(
        {
          sub: 'student-1',
          email: 'student@example.com',
          role: UserRole.STUDENT,
        },
        {
          name: '프로덕트 스튜디오',
          description: '메인 실습 수업',
        },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('수강생은 수업 코드로 수업에 참여할 수 있다', async () => {
    const joinedAt = new Date('2026-04-10T13:00:00.000Z');
    const request: JoinClassRequestDto = {
      classCode: 'AB12-CD34',
    };

    classroomRepository.findOne.mockResolvedValueOnce({
      classId: 'class-1',
      teacherId: 'teacher-1',
      name: '프로덕트 스튜디오',
      description: '메인 실습 수업',
      classCode: 'AB12-CD34',
      createdAt: new Date(),
      updatedAt: new Date(),
      classParticipants: [],
      groups: [],
    } as Classroom);
    classParticipantRepository.findOne.mockResolvedValueOnce(null);
    classParticipantRepository.create.mockImplementation(
      (input) => input as ClassParticipant,
    );
    classParticipantRepository.save.mockResolvedValue({
      classParticipantId: 'participant-1',
      classId: 'class-1',
      studentId: 'student-1',
      joinedAt,
      classroom: undefined as never,
      student: undefined as never,
      groupMember: null,
    } as ClassParticipant);

    const result = await classService.joinClass(
      {
        sub: 'student-1',
        email: 'student@example.com',
        role: UserRole.STUDENT,
      },
      request,
    );

    expect(result).toEqual({
      classId: 'class-1',
      name: '프로덕트 스튜디오',
      description: '메인 실습 수업',
      classCode: 'AB12-CD34',
      joinedAt,
    });
  });

  it('교강사는 수업 참여 API를 호출할 수 없다', async () => {
    await expect(
      classService.joinClass(
        {
          sub: 'teacher-1',
          email: 'teacher@example.com',
          role: UserRole.TEACHER,
        },
        {
          classCode: 'AB12-CD34',
        },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('존재하지 않는 수업 코드는 NotFoundException을 던진다', async () => {
    classroomRepository.findOne.mockResolvedValueOnce(null);

    await expect(
      classService.joinClass(
        {
          sub: 'student-1',
          email: 'student@example.com',
          role: UserRole.STUDENT,
        },
        {
          classCode: 'AB12-CD34',
        },
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('이미 참여한 수업이면 ConflictException을 던진다', async () => {
    classroomRepository.findOne.mockResolvedValueOnce({
      classId: 'class-1',
      teacherId: 'teacher-1',
      name: '프로덕트 스튜디오',
      description: '메인 실습 수업',
      classCode: 'AB12-CD34',
      createdAt: new Date(),
      updatedAt: new Date(),
      classParticipants: [],
      groups: [],
    } as Classroom);
    classParticipantRepository.findOne.mockResolvedValueOnce({
      classParticipantId: 'participant-1',
      classId: 'class-1',
      studentId: 'student-1',
      joinedAt: new Date(),
      classroom: undefined as never,
      student: undefined as never,
      groupMember: null,
    } as ClassParticipant);

    await expect(
      classService.joinClass(
        {
          sub: 'student-1',
          email: 'student@example.com',
          role: UserRole.STUDENT,
        },
        {
          classCode: 'AB12-CD34',
        },
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('본인이 만든 수업에는 참여할 수 없다', async () => {
    classroomRepository.findOne.mockResolvedValueOnce({
      classId: 'class-1',
      teacherId: 'student-1',
      name: '프로덕트 스튜디오',
      description: '메인 실습 수업',
      classCode: 'AB12-CD34',
      createdAt: new Date(),
      updatedAt: new Date(),
      classParticipants: [],
      groups: [],
    } as Classroom);

    await expect(
      classService.joinClass(
        {
          sub: 'student-1',
          email: 'student@example.com',
          role: UserRole.STUDENT,
        },
        {
          classCode: 'AB12-CD34',
        },
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });
  it('교강사는 수업별 모둠 목록을 조회할 수 있다', async () => {
    classroomRepository.findOne.mockResolvedValue({
      classId: 'class-1',
      teacherId: 'teacher-1',
      name: '프로젝트 스튜디오',
      description: '메인 실습 수업',
      classCode: 'AB12-CD34',
      createdAt: new Date('2026-04-10T12:00:00.000Z'),
      updatedAt: new Date(),
      classParticipants: [],
      groups: [
        {
          groupId: 'group-1',
          classId: 'class-1',
          name: '모둠 1',
          createdAt: new Date('2026-04-10T12:00:00.000Z'),
          updatedAt: new Date(),
          classroom: undefined as never,
          groupMembers: [{}, {}] as never,
        } as Group,
      ],
    } as Classroom);

    const result = await classService.getClassGroups(
      {
        sub: 'teacher-1',
        email: 'teacher@example.com',
        role: UserRole.TEACHER,
      },
      'class-1',
    );

    expect(result).toEqual({
      groups: [
        {
          groupId: 'group-1',
          classId: 'class-1',
          name: '모둠 1',
          memberCount: 2,
          createdAt: new Date('2026-04-10T12:00:00.000Z'),
        },
      ],
    });
  });
});
