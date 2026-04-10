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
import { GroupMember } from './entities/group-member.entity';
import { GroupNickname } from './entities/group-nickname.entity';
import { Group } from './entities/group.entity';

describe('GroupService', () => {
  let groupService: GroupService;
  let classroomRepository: jest.Mocked<Repository<Classroom>>;
  let classParticipantRepository: jest.Mocked<Repository<ClassParticipant>>;
  let groupRepository: jest.Mocked<Repository<Group>>;
  let groupMemberRepository: jest.Mocked<Repository<GroupMember>>;
  let groupNicknameRepository: jest.Mocked<Repository<GroupNickname>>;

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
            remove: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(GroupMember),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            count: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(GroupNickname),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    groupService = module.get<GroupService>(GroupService);
    classroomRepository = module.get(getRepositoryToken(Classroom));
    classParticipantRepository = module.get(getRepositoryToken(ClassParticipant));
    groupRepository = module.get(getRepositoryToken(Group));
    groupMemberRepository = module.get(getRepositoryToken(GroupMember));
    groupNicknameRepository = module.get(getRepositoryToken(GroupNickname));
  });

  it('teacher can create a group and issue nicknames for members', async () => {
    const request: CreateGroupRequestDto = {
      classId: 'class-1',
      name: '모둠 3',
      studentIds: ['student-1', 'student-2'],
    };
    const createdAt = new Date('2026-04-10T12:00:00.000Z');

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
    } as Group);
    groupMemberRepository.create.mockImplementation(
      (input) => input as GroupMember,
    );
    groupMemberRepository.save.mockResolvedValue([
      {
        groupMemberId: 'group-member-1',
        groupId: 'group-1',
        classParticipantId: 'participant-1',
      },
      {
        groupMemberId: 'group-member-2',
        groupId: 'group-1',
        classParticipantId: 'participant-2',
      },
    ] as unknown as never);
    groupNicknameRepository.create.mockImplementation(
      (input) => input as GroupNickname,
    );
    groupNicknameRepository.save.mockResolvedValue([] as unknown as never);

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
    expect(groupNicknameRepository.create).toHaveBeenCalledTimes(2);

    const createdNicknames = groupNicknameRepository.create.mock.calls.map(
      ([input]) => input.nickname,
    );
    expect(createdNicknames[0]).toBeDefined();
    expect(createdNicknames[1]).toBeDefined();
    expect(createdNicknames[0]).not.toBe(createdNicknames[1]);
  });

  it('throws conflict when a student is already assigned to another group', async () => {
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

  it('returns empty state when a student has no group yet', async () => {
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

  it('returns my group when a student is assigned', async () => {
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

  it('blocks non-teachers from creating groups', async () => {
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

  it('throws when a student tries to read a group they do not belong to', async () => {
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
            studentId: 'student-2',
            student: { name: '다른 학생' },
          },
          groupNickname: {
            nickname: '푸른 나침반',
          },
        },
      ],
    } as Group);

    await expect(
      groupService.getGroupDetail(
        {
          sub: 'student-1',
          email: 'student@example.com',
          role: UserRole.STUDENT,
        },
        'group-1',
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('returns saved nicknames to student members', async () => {
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
          groupNickname: {
            nickname: '푸른 나침반',
          },
        },
        {
          groupMemberId: 'group-member-2',
          classParticipant: {
            studentId: 'student-2',
            student: { name: '김하늘' },
          },
          groupNickname: {
            nickname: '반짝이는 파도',
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
          displayName: '푸른 나침반',
          isMe: true,
        },
        {
          groupMemberId: 'group-member-2',
          displayName: '반짝이는 파도',
          isMe: false,
        },
      ],
    });
  });

  it('returns real names to teacher', async () => {
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
          groupNickname: {
            nickname: '푸른 나침반',
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

  it('removes nicknames for removed members and issues new nicknames for added members on update', async () => {
    groupRepository.findOne.mockResolvedValue({
      groupId: 'group-1',
      classId: 'class-1',
      name: '모둠 3',
      createdAt: new Date('2026-04-10T12:00:00.000Z'),
      classroom: {
        classId: 'class-1',
        teacherId: 'teacher-1',
      },
    } as Group);
    classParticipantRepository.find.mockResolvedValue([
      {
        classParticipantId: 'participant-1',
        classId: 'class-1',
        studentId: 'student-1',
      },
      {
        classParticipantId: 'participant-3',
        classId: 'class-1',
        studentId: 'student-3',
      },
    ] as ClassParticipant[]);
    groupMemberRepository.find
      .mockResolvedValueOnce([
        {
          groupMemberId: 'group-member-1',
          groupId: 'group-1',
          classParticipantId: 'participant-1',
          groupNickname: {
            nickname: '푸른 나침반',
          },
        },
        {
          groupMemberId: 'group-member-2',
          groupId: 'group-1',
          classParticipantId: 'participant-2',
          groupNickname: {
            nickname: '반짝이는 파도',
          },
        },
      ] as GroupMember[])
      .mockResolvedValueOnce([]);
    groupMemberRepository.remove.mockResolvedValue([] as never);
    groupMemberRepository.create.mockImplementation(
      (input) => input as GroupMember,
    );
    groupMemberRepository.save.mockResolvedValue([
      {
        groupMemberId: 'group-member-3',
        groupId: 'group-1',
        classParticipantId: 'participant-3',
      },
    ] as unknown as never);
    groupNicknameRepository.create.mockImplementation(
      (input) => input as GroupNickname,
    );
    groupNicknameRepository.save.mockResolvedValue([] as unknown as never);
    groupRepository.save.mockImplementation(async (input) => input as Group);
    groupMemberRepository.count.mockResolvedValue(2);

    const result = await groupService.updateGroup(
      {
        sub: 'teacher-1',
        email: 'teacher@example.com',
        role: UserRole.TEACHER,
      },
      'group-1',
      {
        name: '모둠 4',
        studentIds: ['student-1', 'student-3'],
      },
    );

    expect(groupMemberRepository.remove).toHaveBeenCalledTimes(1);
    expect(groupNicknameRepository.create).toHaveBeenCalledTimes(1);
    expect(
      groupNicknameRepository.create.mock.calls[0][0].nickname,
    ).not.toBe('푸른 나침반');
    expect(result).toEqual({
      groupId: 'group-1',
      classId: 'class-1',
      name: '모둠 4',
      memberCount: 2,
      createdAt: new Date('2026-04-10T12:00:00.000Z'),
    });
  });

  it('allows teacher to delete owned group', async () => {
    const group = {
      groupId: 'group-1',
      classId: 'class-1',
      name: '모둠 3',
      classroom: {
        classId: 'class-1',
        teacherId: 'teacher-1',
      },
    } as Group;
    groupRepository.findOne.mockResolvedValue(group);
    groupRepository.remove.mockResolvedValue(group as never);

    const result = await groupService.deleteGroup(
      {
        sub: 'teacher-1',
        email: 'teacher@example.com',
        role: UserRole.TEACHER,
      },
      'group-1',
    );

    expect(result).toEqual({
      message: '모둠이 삭제되었습니다.',
    });
  });

  it('throws when a student has no class participation record', async () => {
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
});
