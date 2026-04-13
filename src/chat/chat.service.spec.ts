import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRole } from '../auth/signup/enums/user-role.enum';
import { GroupService } from '../group/group.service';
import { OpenAiService } from '../openai/openai.service';
import { ChatService } from './chat.service';
import { ChatMessage } from './entities/chat-message.entity';

describe('ChatService', () => {
  let chatService: ChatService;
  let chatMessageRepository: jest.Mocked<Repository<ChatMessage>>;
  let groupService: jest.Mocked<GroupService>;
  let openAiService: jest.Mocked<OpenAiService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        {
          provide: getRepositoryToken(ChatMessage),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
          },
        },
        {
          provide: GroupService,
          useValue: {
            getChatParticipantInfo: jest.fn(),
            getGroupAnalysisRoster: jest.fn(),
            getTeacherContributionRoster: jest.fn(),
          },
        },
        {
          provide: OpenAiService,
          useValue: {
            generateMessageAdvice: jest.fn(),
            generateInterventionAdvice: jest.fn(),
            generateContributionAnalysis: jest.fn(),
          },
        },
      ],
    }).compile();

    chatService = module.get(ChatService);
    chatMessageRepository = module.get(getRepositoryToken(ChatMessage));
    groupService = module.get(GroupService);
    openAiService = module.get(OpenAiService);
  });

  it('returns recent messages in ascending sent order', async () => {
    chatMessageRepository.find.mockResolvedValue([
      {
        messageId: 'message-2',
        groupId: 'group-1',
        senderUserId: 'student-1',
        nickname: 'second-user',
        content: 'second',
        sentAt: new Date('2026-04-12T12:01:00.000Z'),
      },
      {
        messageId: 'message-1',
        groupId: 'group-1',
        senderUserId: 'student-1',
        nickname: 'first-user',
        content: 'first',
        sentAt: new Date('2026-04-12T12:00:00.000Z'),
      },
    ] as ChatMessage[]);

    await expect(chatService.getRecentMessages('group-1')).resolves.toEqual([
      {
        messageId: 'message-1',
        groupId: 'group-1',
        nickname: 'first-user',
        content: 'first',
        sentAt: '2026-04-12T12:00:00.000Z',
      },
      {
        messageId: 'message-2',
        groupId: 'group-1',
        nickname: 'second-user',
        content: 'second',
        sentAt: '2026-04-12T12:01:00.000Z',
      },
    ]);
  });

  it('trims message content before saving', async () => {
    chatMessageRepository.create.mockImplementation(
      (input) => input as ChatMessage,
    );
    chatMessageRepository.save.mockImplementation(async (message) => ({
      ...(message as ChatMessage),
      messageId: 'message-1',
      sentAt: new Date('2026-04-12T12:00:00.000Z'),
    }));

    await expect(
      chatService.createMessage(
        'group-1',
        'student-1',
        'quiet-whale',
        '  hello there  ',
      ),
    ).resolves.toEqual({
      messageId: 'message-1',
      groupId: 'group-1',
      nickname: 'quiet-whale',
      content: 'hello there',
      sentAt: '2026-04-12T12:00:00.000Z',
    });
  });

  it('rejects blank message content', async () => {
    await expect(
      chatService.createMessage('group-1', 'student-1', 'quiet-whale', '   '),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('blocks students from contribution analysis', async () => {
    await expect(
      chatService.getContributionAnalysis(
        {
          sub: 'student-1',
          email: 'student@example.com',
          role: UserRole.STUDENT,
        },
        {
          groupId: 'group-1',
        },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('keeps silent members in contribution analysis output', async () => {
    groupService.getTeacherContributionRoster.mockResolvedValue({
      groupId: 'group-1',
      participantNicknames: ['planner', 'silent-recorder'],
    });
    chatMessageRepository.find.mockResolvedValue([
      {
        messageId: 'message-1',
        groupId: 'group-1',
        senderUserId: 'student-1',
        nickname: 'planner',
        content: 'I will organize the presentation order.',
        sentAt: new Date('2026-04-12T12:00:00.000Z'),
      },
    ] as ChatMessage[]);
    openAiService.generateContributionAnalysis.mockResolvedValue({
      summary: 'Roles are becoming clearer in the recent discussion.',
      members: [
        {
          nickname: 'planner',
          contributionScore: 82,
          contributionTypes: ['summarizer', 'facilitator'],
          reason:
            'They organized the discussion flow. They also connected several ideas into one direction.',
        },
      ],
    });

    await expect(
      chatService.getContributionAnalysis(
        {
          sub: 'teacher-1',
          email: 'teacher@example.com',
          role: UserRole.TEACHER,
        },
        {
          groupId: 'group-1',
        },
      ),
    ).resolves.toEqual({
      groupId: 'group-1',
      summary: 'Roles are becoming clearer in the recent discussion.',
      members: [
        {
          nickname: 'planner',
          contributionScore: 82,
          contributionLevel: 'high',
          contributionTypes: ['summarizer', 'facilitator'],
          reason:
            'They organized the discussion flow. They also connected several ideas into one direction.',
        },
        {
          nickname: 'silent-recorder',
          contributionScore: 0,
          contributionLevel: 'low',
          contributionTypes: [],
          reason:
            '최근 대화에서 뚜렷한 기여 근거가 적었습니다. 더 많은 발화와 역할 참여가 필요합니다.',
        },
      ],
    });
  });
});
