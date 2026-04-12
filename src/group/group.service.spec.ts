import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { User } from '../auth/signup/entities/user.entity';
import { UserRole } from '../auth/signup/enums/user-role.enum';
import { ChatRoomService } from '../chat/chat-room.service';
import { ClassParticipant } from '../class/entities/class-participant.entity';
import { Classroom } from '../class/entities/class.entity';
import { OpenAiService } from '../openai/openai.service';
import { Survey } from '../survey/entities/survey.entity';
import { CreateGroupRequestDto } from './dto/create-group.request.dto';
import { GroupService } from './group.service';
import { GroupMember } from './entities/group-member.entity';
import { GroupNickname } from './entities/group-nickname.entity';
import { NicknameReservation } from './entities/nickname-reservation.entity';
import { Group } from './entities/group.entity';

describe('GroupService', () => {
  let groupService: GroupService;
  let classroomRepository: jest.Mocked<Repository<Classroom>>;
  let classParticipantRepository: jest.Mocked<Repository<ClassParticipant>>;
  let userRepository: jest.Mocked<Repository<User>>;
  let surveyRepository: jest.Mocked<Repository<Survey>>;
  let groupRepository: jest.Mocked<Repository<Group>>;
  let groupMemberRepository: jest.Mocked<Repository<GroupMember>>;
  let groupNicknameRepository: jest.Mocked<Repository<GroupNickname>>;
  let nicknameReservationRepository: jest.Mocked<
    Repository<NicknameReservation>
  >;
  let chatRoomService: jest.Mocked<ChatRoomService>;
  let openAiService: jest.Mocked<OpenAiService>;

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
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Survey),
          useValue: {
            find: jest.fn(),
          },
        },
        {
          provide: ChatRoomService,
          useValue: {
            syncGroupAudience: jest.fn(),
            closeGroup: jest.fn(),
          },
        },
        {
          provide: OpenAiService,
          useValue: {
            generateStudentNickname: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Group),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
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
            find: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(NicknameReservation),
          useValue: {
            insert: jest.fn(),
          },
        },
      ],
    }).compile();

    groupService = module.get(GroupService);
    classroomRepository = module.get(getRepositoryToken(Classroom));
    classParticipantRepository = module.get(getRepositoryToken(ClassParticipant));
    userRepository = module.get(getRepositoryToken(User));
    surveyRepository = module.get(getRepositoryToken(Survey));
    chatRoomService = module.get(ChatRoomService);
    openAiService = module.get(OpenAiService);
    groupRepository = module.get(getRepositoryToken(Group));
    groupMemberRepository = module.get(getRepositoryToken(GroupMember));
    groupNicknameRepository = module.get(getRepositoryToken(GroupNickname));
    nicknameReservationRepository = module.get(
      getRepositoryToken(NicknameReservation),
    );
  });

  it('teacher can create a group and issue AI nicknames for members', async () => {
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
    surveyRepository.find.mockResolvedValue([
      {
        surveyId: 'survey-1',
        userId: 'student-1',
        mbti: 'INTJ',
        personality: '차분하고 계획적이다.',
        preference: '정리와 문서화를 선호한다.',
      },
      {
        surveyId: 'survey-2',
        userId: 'student-2',
        mbti: 'ENFP',
        personality: '아이디어를 많이 내는 편이다.',
        preference: '자유로운 브레인스토밍을 좋아한다.',
      },
    ] as Survey[]);
    groupMemberRepository.find.mockResolvedValue([]);
    groupNicknameRepository.find.mockResolvedValue([]);
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
    groupMemberRepository.save.mockResolvedValue([] as unknown as never);
    groupNicknameRepository.create.mockImplementation(
      (input) => input as GroupNickname,
    );
    groupNicknameRepository.save.mockResolvedValue([] as unknown as never);
    nicknameReservationRepository.insert.mockResolvedValue({} as never);
    openAiService.generateStudentNickname
      .mockResolvedValueOnce({
        nickname: '차분한 설계자',
        reason: '차분하게 정리하고 구조를 잡는 성향을 반영한 닉네임이에요.',
      })
      .mockResolvedValueOnce({
        nickname: '유연한 탐험가',
        reason: '새로운 아이디어를 즐기는 성향을 반영한 닉네임이에요.',
      });

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
    expect(openAiService.generateStudentNickname).toHaveBeenCalledTimes(2);
    expect(nicknameReservationRepository.insert).toHaveBeenCalledWith({
      nickname: '차분한 설계자',
    });
    expect(groupNicknameRepository.create).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        classId: 'class-1',
        classParticipantId: 'participant-1',
        nickname: '차분한 설계자',
        nicknameReason: '차분하게 정리하고 구조를 잡는 성향을 반영한 닉네임이에요.',
      }),
    );
    expect(groupNicknameRepository.create).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        classId: 'class-1',
        classParticipantId: 'participant-2',
        nickname: '유연한 탐험가',
        nicknameReason: '새로운 아이디어를 즐기는 성향을 반영한 닉네임이에요.',
      }),
    );
  });

  it('retries when OpenAI returns a duplicate nickname', async () => {
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
    surveyRepository.find.mockResolvedValue([] as Survey[]);
    groupMemberRepository.find.mockResolvedValue([]);
    groupNicknameRepository.find.mockResolvedValue([]);
    groupRepository.create.mockImplementation((input) => input as Group);
    groupRepository.save.mockResolvedValue({
      groupId: 'group-1',
      classId: 'class-1',
      name: '모둠 1',
      createdAt: new Date('2026-04-10T12:00:00.000Z'),
      updatedAt: new Date('2026-04-10T12:00:00.000Z'),
    } as Group);
    groupMemberRepository.create.mockImplementation(
      (input) => input as GroupMember,
    );
    groupMemberRepository.save.mockResolvedValue([] as unknown as never);
    groupNicknameRepository.create.mockImplementation(
      (input) => input as GroupNickname,
    );
    groupNicknameRepository.save.mockResolvedValue([] as unknown as never);
    openAiService.generateStudentNickname
      .mockResolvedValueOnce({
        nickname: '차분한 설계자',
        reason: '차분하게 정리하고 구조를 잡는 성향을 반영한 닉네임이에요.',
      })
      .mockResolvedValueOnce({
        nickname: '유연한 탐험가',
        reason: '새로운 아이디어를 즐기는 성향을 반영한 닉네임이에요.',
      });
    nicknameReservationRepository.insert
      .mockRejectedValueOnce(
        new QueryFailedError(
          'INSERT',
          [],
          Object.assign(new Error('duplicate key value violates unique constraint'), {
            code: '23505',
          }),
        ),
      )
      .mockResolvedValueOnce({} as never);

    await groupService.createGroup(
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
    );

    expect(openAiService.generateStudentNickname).toHaveBeenNthCalledWith(2, {
      survey: null,
      attemptedNicknames: ['차분한 설계자'],
    });
    expect(groupNicknameRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        nickname: '유연한 탐험가',
        nicknameReason: '새로운 아이디어를 즐기는 성향을 반영한 닉네임이에요.',
      }),
    );
  });

  it('moves a student from another group when creating a new group', async () => {
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
    surveyRepository.find.mockResolvedValue([] as Survey[]);
    groupMemberRepository.find.mockResolvedValue([
      {
        groupMemberId: 'group-member-1',
        groupId: 'group-1',
        classParticipantId: 'participant-1',
      },
    ] as GroupMember[]);
    groupRepository.create.mockImplementation((input) => input as Group);
    groupRepository.save.mockResolvedValue({
      groupId: 'group-2',
      classId: 'class-1',
      name: '모둠 1',
      createdAt: new Date('2026-04-10T12:00:00.000Z'),
      updatedAt: new Date('2026-04-10T12:00:00.000Z'),
    } as Group);
    groupMemberRepository.create.mockImplementation(
      (input) => input as GroupMember,
    );
    groupMemberRepository.save.mockResolvedValue([] as unknown as never);
    groupNicknameRepository.find.mockResolvedValue([
      {
        classParticipantId: 'participant-1',
        nickname: '이미 있는 닉네임',
      },
    ] as GroupNickname[]);

    const result = await groupService.createGroup(
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
    );

    expect(result.groupId).toBe('group-2');
    expect(groupMemberRepository.remove).toHaveBeenCalledWith([
      expect.objectContaining({
        groupMemberId: 'group-member-1',
      }),
    ]);
    expect(openAiService.generateStudentNickname).not.toHaveBeenCalled();
  });

  it('syncs chat audience after updating group members', async () => {
    groupRepository.findOne.mockResolvedValueOnce({
      groupId: 'group-1',
      classId: 'class-1',
      name: '모둠 1',
      createdAt: new Date('2026-04-10T12:00:00.000Z'),
      updatedAt: new Date('2026-04-10T12:00:00.000Z'),
      classroom: {
        classId: 'class-1',
        teacherId: 'teacher-1',
      },
    } as unknown as Group);
    classParticipantRepository.find.mockResolvedValue([
      {
        classParticipantId: 'participant-2',
        classId: 'class-1',
        studentId: 'student-2',
      },
    ] as ClassParticipant[]);
    surveyRepository.find.mockResolvedValue([] as Survey[]);
    groupMemberRepository.find.mockResolvedValue([
      {
        groupMemberId: 'group-member-1',
        groupId: 'group-1',
        classParticipantId: 'participant-1',
      },
    ] as GroupMember[]);
    groupRepository.save.mockResolvedValue({
      groupId: 'group-1',
      classId: 'class-1',
      name: '모둠 2',
      createdAt: new Date('2026-04-10T12:00:00.000Z'),
      updatedAt: new Date('2026-04-10T13:00:00.000Z'),
    } as Group);
    groupMemberRepository.create.mockImplementation(
      (input) => input as GroupMember,
    );
    groupMemberRepository.save.mockResolvedValue([] as unknown as never);
    groupNicknameRepository.find.mockResolvedValue([] as GroupNickname[]);
    groupNicknameRepository.create.mockImplementation(
      (input) => input as GroupNickname,
    );
    groupNicknameRepository.save.mockResolvedValue([] as unknown as never);
    groupMemberRepository.count.mockResolvedValue(1);
    nicknameReservationRepository.insert.mockResolvedValue({} as never);
    openAiService.generateStudentNickname.mockResolvedValue({
      nickname: '차분한 설계자',
      reason: '차분하게 정리하고 구조를 잡는 성향을 반영한 닉네임이에요.',
    });

    await groupService.updateGroup(
      {
        sub: 'teacher-1',
        email: 'teacher@example.com',
        role: UserRole.TEACHER,
      },
      'group-1',
      {
        name: '모둠 2',
        studentIds: ['student-2'],
      },
    );

    expect(chatRoomService.syncGroupAudience).toHaveBeenCalledWith('group-1');
  });

  it('closes the chat room before deleting a group', async () => {
    groupRepository.findOne.mockResolvedValue({
      groupId: 'group-1',
      classId: 'class-1',
      name: '모둠 1',
      createdAt: new Date(),
      updatedAt: new Date(),
      classroom: {
        classId: 'class-1',
        teacherId: 'teacher-1',
      },
    } as unknown as Group);

    await groupService.deleteGroup(
      {
        sub: 'teacher-1',
        email: 'teacher@example.com',
        role: UserRole.TEACHER,
      },
      'group-1',
    );

    expect(chatRoomService.closeGroup).toHaveBeenCalledWith('group-1');
    expect(groupRepository.remove).toHaveBeenCalled();
  });

  it('returns class-scoped nicknames to student members in group detail', async () => {
    groupRepository.findOne.mockResolvedValue({
      groupId: 'group-1',
      classId: 'class-1',
      name: '모둠 3',
      createdAt: new Date(),
      updatedAt: new Date(),
      classroom: {
        classId: 'class-1',
        teacherId: 'teacher-1',
      },
      groupMembers: [
        {
          groupMemberId: 'group-member-1',
          classParticipant: {
            studentId: 'student-1',
            student: { name: '최학생' },
            groupNickname: {
              nickname: '차분한 설계자',
              nicknameReason: '차분하게 정리하고 구조를 잡는 성향을 반영한 닉네임이에요.',
            },
          },
        },
      ],
    } as unknown as Group);

    const result = await groupService.getGroupDetail(
      {
        sub: 'student-1',
        email: 'student@example.com',
        role: UserRole.STUDENT,
      },
      'group-1',
    );

    expect(result.members[0]).toEqual({
      groupMemberId: 'group-member-1',
      displayName: '차분한 설계자',
      isMe: true,
    });
  });

  it('returns my group nickname and reason for students', async () => {
    groupRepository.findOne.mockResolvedValue({
      groupId: 'group-1',
      classId: 'class-1',
      name: '모둠 3',
      createdAt: new Date(),
      updatedAt: new Date(),
      classroom: {
        classId: 'class-1',
        teacherId: 'teacher-1',
      },
      groupMembers: [
        {
          groupMemberId: 'group-member-1',
          classParticipant: {
            studentId: 'student-1',
            student: { name: '최학생' },
            groupNickname: {
              nickname: '차분한 설계자',
              nicknameReason:
                '차분하게 정리하고 구조를 잡는 성향을 반영한 닉네임이에요.',
            },
          },
        },
      ],
    } as unknown as Group);

    await expect(
      groupService.getMyGroupNickname(
        {
          sub: 'student-1',
          email: 'student@example.com',
          role: UserRole.STUDENT,
        },
        'group-1',
      ),
    ).resolves.toEqual({
      groupId: 'group-1',
      nickname: '차분한 설계자',
      reason: '차분하게 정리하고 구조를 잡는 성향을 반영한 닉네임이에요.',
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

  it('returns the teacher and current members as chat audience user ids', async () => {
    groupRepository.findOne.mockResolvedValue({
      groupId: 'group-1',
      classId: 'class-1',
      name: '모둠 1',
      createdAt: new Date(),
      updatedAt: new Date(),
      classroom: {
        classId: 'class-1',
        teacherId: 'teacher-1',
      },
      groupMembers: [
        {
          groupMemberId: 'group-member-1',
          classParticipant: {
            classParticipantId: 'participant-1',
            studentId: 'student-1',
          },
        },
        {
          groupMemberId: 'group-member-2',
          classParticipant: {
            classParticipantId: 'participant-2',
            studentId: 'student-2',
          },
        },
      ],
    } as unknown as Group);

    await expect(groupService.getChatAudienceUserIds('group-1')).resolves.toEqual(
      ['teacher-1', 'student-1', 'student-2'],
    );
  });

  it('returns the teacher name as the chat nickname for teachers', async () => {
    groupRepository.findOne.mockResolvedValue({
      groupId: 'group-1',
      classId: 'class-1',
      name: '모둠 1',
      createdAt: new Date(),
      updatedAt: new Date(),
      classroom: {
        classId: 'class-1',
        teacherId: 'teacher-1',
      },
      groupMembers: [],
    } as unknown as Group);
    userRepository.findOne.mockResolvedValue({
      userId: 'teacher-1',
      name: '김교사',
    } as User);

    await expect(
      groupService.getChatParticipantInfo(
        {
          sub: 'teacher-1',
          email: 'teacher@example.com',
          role: UserRole.TEACHER,
        },
        'group-1',
      ),
    ).resolves.toEqual({
      groupId: 'group-1',
      nickname: '김교사',
    });
  });
});
