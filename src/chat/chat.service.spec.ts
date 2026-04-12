import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatService } from './chat.service';
import { ChatMessage } from './entities/chat-message.entity';

describe('ChatService', () => {
  let chatService: ChatService;
  let chatMessageRepository: jest.Mocked<Repository<ChatMessage>>;

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
      ],
    }).compile();

    chatService = module.get<ChatService>(ChatService);
    chatMessageRepository = module.get(getRepositoryToken(ChatMessage));
  });

  it('returns recent messages in ascending sent order', async () => {
    chatMessageRepository.find.mockResolvedValue([
      {
        messageId: 'message-2',
        groupId: 'group-1',
        senderUserId: 'student-1',
        nickname: '두 번째',
        content: 'second',
        sentAt: new Date('2026-04-12T12:01:00.000Z'),
      },
      {
        messageId: 'message-1',
        groupId: 'group-1',
        senderUserId: 'student-1',
        nickname: '첫 번째',
        content: 'first',
        sentAt: new Date('2026-04-12T12:00:00.000Z'),
      },
    ] as ChatMessage[]);

    await expect(chatService.getRecentMessages('group-1')).resolves.toEqual([
      {
        messageId: 'message-1',
        groupId: 'group-1',
        nickname: '첫 번째',
        content: 'first',
        sentAt: '2026-04-12T12:00:00.000Z',
      },
      {
        messageId: 'message-2',
        groupId: 'group-1',
        nickname: '두 번째',
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
        '조용한 고래',
        '  안녕하세요  ',
      ),
    ).resolves.toEqual({
      messageId: 'message-1',
      groupId: 'group-1',
      nickname: '조용한 고래',
      content: '안녕하세요',
      sentAt: '2026-04-12T12:00:00.000Z',
    });
  });

  it('rejects blank message content', async () => {
    await expect(
      chatService.createMessage('group-1', 'student-1', '조용한 고래', '   '),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
