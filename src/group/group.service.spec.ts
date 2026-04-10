import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRole } from '../auth/signup/enums/user-role.enum';
import { ClassParticipant } from '../class/entities/class-participant.entity';
import { Classroom } from '../class/entities/class.entity';
import { CreateGroupRequestDto } from './dto/create-group.request.dto';
import { GroupService } from './group.service';
import { Group } from './entities/group.entity';
import { GroupMember } from './entities/group-member.entity';

describe('GroupService', () => {
  let groupService: GroupService;
  let classroomRepository: jest.Mocked<Repository<Classroom>>;
  let classParticipantRepository: jest.Mocked<Repository<ClassParticipant>>;
  let groupRepository: jest.Mocked<Repository<Group>>;
  let groupMemberRepository: jest.Mocked<Repository<GroupMember>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GroupService,
        {
          provide: getRepositoryToken(Classroom),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(ClassParticipant),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Group),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(GroupMember),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
          },
        },
      ],
    }).compile();

    groupService = module.get<GroupService>(GroupService);
    classroomRepository = module.get(getRepositoryToken(Classroom));
    classParticipantRepository = module.get(getRepositoryToken(ClassParticipant));
    groupRepository = module.get(getRepositoryToken(Group));
    groupMemberRepository = module.get(getRepositoryToken(GroupMember));
  });

  it('교강사는 수업 참여 학생들로 모둠을 생성할 수 있다', async () => {
    const request: CreateGroupRequestDto = {
      classId: 'class-1',
      name: '모둠 3',
      studentIds: ['student-1', 'student-2'],
    };
    const createdAt = new Date('2026-04-10T12:00:00.000Z');

    classroomRepository.findOne.mockResolvedValue({
      classId: 'class-1',
      teacherId: 'teacher-1',
      name: '프로덕트 스튜디오',
      description: null,
      classCode: 'AB12-CD34',
      createdAt,
      updatedAt: createdAt,
      classParticipants: [],
      groups: [],
    } as Classroom);
    classParticipantRepository.find.mockResolvedValue([
      {
        classParticipantId: 'participant-1',
        classId: 'class-1',
        studentId: 'student-1',
      },
      {
        classParticipantId: 'participant-2',
        classId: 'class-1',
        studentId: 'student-2',
      },
    ] as ClassParticipant[]);
    groupMemberRepository.find.mockResolvedValue([]);
    groupRepository.create.mockImplementation((input) => input as Group);
    groupRepository.save.mockResolvedValue({
      groupId: 'group-1',
      classId: 'class-1',
      name: '모둠 3',
      createdAt,
      updatedAt: createdAt,
      classroom: undefined as never,
      groupMembers: [],
    } as Group);
    groupMemberRepository.create.mockImplementation(
      (input) => input as GroupMember,
    );
    (groupMemberRepository.save as jest.Mock).mockResolvedValue([]);

    const result = await groupService.createGroup(
      {
        sub: 'teacher-1',
        email: 'teacher@example.com',
        role: UserRole.TEACHER,
      },
      request,
    );

    expect(result).toEqual({
      groupId: 'group-1',
      classId: 'class-1',
      name: '모둠 3',
      memberCount: 2,
      createdAt,
    });
  });

  it('이미 다른 모둠에 배정된 수강생이 있으면 ConflictException을 던진다', async () => {
    classroomRepository.findOne.mockResolvedValue({
      classId: 'class-1',
      teacherId: 'teacher-1',
    } as Classroom);
    classParticipantRepository.find.mockResolvedValue([
      {
        classParticipantId: 'participant-1',
        classId: 'class-1',
        studentId: 'student-1',
      },
    ] as ClassParticipant[]);
    groupMemberRepository.find.mockResolvedValue([
      {
        groupMemberId: 'group-member-1',
        groupId: 'group-1',
        classParticipantId: 'participant-1',
      },
    ] as GroupMember[]);

    await expect(
      groupService.createGroup(
        {
          sub: 'teacher-1',
          email: 'teacher@example.com',
          role: UserRole.TEACHER,
        },
        {
          classId: 'class-1',
          name: '모둠 1',
          studentIds: ['student-1'],
        },
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('수강생은 내 모둠이 없으면 안내 문구를 받는다', async () => {
    classParticipantRepository.findOne.mockResolvedValue({
      classParticipantId: 'participant-1',
      classId: 'class-1',
      studentId: 'student-1',
      groupMember: null,
    } as ClassParticipant);

    const result = await groupService.getMyGroup(
      {
        sub: 'student-1',
        email: 'student@example.com',
        role: UserRole.STUDENT,
      },
      'class-1',
    );

    expect(result).toEqual({
      hasGroup: false,
      group: null,
      message: '참여 중인 모둠이 없습니다.',
    });
  });

  it('수강생은 내 모둠 정보를 조회할 수 있다', async () => {
    classParticipantRepository.findOne.mockResolvedValue({
      classParticipantId: 'participant-1',
      classId: 'class-1',
      studentId: 'student-1',
      groupMember: {
        groupMemberId: 'group-member-1',
        groupId: 'group-1',
        classParticipantId: 'participant-1',
        group: {
          groupId: 'group-1',
          classId: 'class-1',
          name: '모둠 3',
          groupMembers: [{}, {}, {}],
        },
      },
    } as ClassParticipant);

    const result = await groupService.getMyGroup(
      {
        sub: 'student-1',
        email: 'student@example.com',
        role: UserRole.STUDENT,
      },
      'class-1',
    );

    expect(result).toEqual({
      hasGroup: true,
      group: {
        groupId: 'group-1',
        classId: 'class-1',
        name: '모둠 3',
        memberCount: 3,
      },
      message: null,
    });
  });

  it('교강사가 아닌 사용자는 모둠 생성이 불가능하다', async () => {
    await expect(
      groupService.createGroup(
        {
          sub: 'student-1',
          email: 'student@example.com',
          role: UserRole.STUDENT,
        },
        {
          classId: 'class-1',
          name: '모둠 1',
        },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('내가 참여하지 않은 수업의 모둠은 조회할 수 없다', async () => {
    classParticipantRepository.findOne.mockResolvedValue(null);

    await expect(
      groupService.getMyGroup(
        {
          sub: 'student-1',
          email: 'student@example.com',
          role: UserRole.STUDENT,
        },
        'class-1',
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('수강생은 본인이 속한 모둠의 상세를 익명 표시명으로 조회할 수 있다', async () => {
    groupRepository.findOne.mockResolvedValue({
      groupId: 'group-1',
      classId: 'class-1',
      name: '모둠 3',
      classroom: {
        classId: 'class-1',
        teacherId: 'teacher-1',
      },
      groupMembers: [
        {
          groupMemberId: 'group-member-1',
          classParticipant: {
            studentId: 'student-1',
            student: { name: '실명1' },
          },
        },
        {
          groupMemberId: 'group-member-2',
          classParticipant: {
            studentId: 'student-2',
            student: { name: '실명2' },
          },
        },
      ],
    } as Group);

    const result = await groupService.getGroupDetail(
      {
        sub: 'student-1',
        email: 'student@example.com',
        role: UserRole.STUDENT,
      },
      'group-1',
    );

    expect(result).toEqual({
      groupId: 'group-1',
      classId: 'class-1',
      name: '모둠 3',
      memberCount: 2,
      members: [
        {
          groupMemberId: 'group-member-1',
          displayName: '모둠원 1',
          isMe: true,
        },
        {
          groupMemberId: 'group-member-2',
          displayName: '모둠원 2',
          isMe: false,
        },
      ],
    });
  });

  it('교강사는 본인 수업 모둠의 상세를 실명 기준으로 조회할 수 있다', async () => {
    groupRepository.findOne.mockResolvedValue({
      groupId: 'group-1',
      classId: 'class-1',
      name: '모둠 3',
      classroom: {
        classId: 'class-1',
        teacherId: 'teacher-1',
      },
      groupMembers: [
        {
          groupMemberId: 'group-member-1',
          classParticipant: {
            studentId: 'student-1',
            student: { name: '최민수' },
          },
        },
      ],
    } as Group);

    const result = await groupService.getGroupDetail(
      {
        sub: 'teacher-1',
        email: 'teacher@example.com',
        role: UserRole.TEACHER,
      },
      'group-1',
    );

    expect(result).toEqual({
      groupId: 'group-1',
      classId: 'class-1',
      name: '모둠 3',
      memberCount: 1,
      members: [
        {
          groupMemberId: 'group-member-1',
          displayName: '최민수',
          isMe: false,
        },
      ],
    });
  });
});
