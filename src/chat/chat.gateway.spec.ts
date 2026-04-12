import { BadRequestException } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { GroupService } from '../group/group.service';
import { TokenService } from '../auth/login/token/token.service';
import { ConfigService } from '@nestjs/config';

describe('ChatGateway', () => {
  let chatGateway: ChatGateway;
  let chatService: jest.Mocked<Pick<ChatService, 'createMessage' | 'getRecentMessages'>>;
  let groupService: jest.Mocked<
    Pick<GroupService, 'getChatParticipantInfo' | 'getChatAudienceUserIds'>
  >;

  beforeEach(() => {
    chatService = {
      createMessage: jest.fn(),
      getRecentMessages: jest.fn(),
    };
    groupService = {
      getChatParticipantInfo: jest.fn(),
      getChatAudienceUserIds: jest.fn(),
    };

    chatGateway = new ChatGateway(
      chatService as unknown as ChatService,
      {} as TokenService,
      groupService as unknown as GroupService,
      {
        get: jest.fn(),
      } as unknown as ConfigService,
    );
  });

  it('emits messages only to authorized sockets and removes stale listeners', async () => {
    const senderSocket = {
      data: {
        currentUser: {
          sub: 'student-1',
          email: 'student@example.com',
          role: 'student',
        },
        groupId: 'group-1',
        recentMessageTimestamps: [],
      },
    };
    const authorizedSocket = {
      data: {
        currentUser: {
          sub: 'student-1',
        },
      },
      emit: jest.fn(),
      leave: jest.fn(),
    };
    const staleSocket = {
      data: {
        currentUser: {
          sub: 'student-2',
        },
        groupId: 'group-1',
        nickname: '이전 멤버',
      },
      emit: jest.fn(),
      leave: jest.fn(),
    };

    groupService.getChatParticipantInfo.mockResolvedValue({
      groupId: 'group-1',
      nickname: '조용한 고래',
    });
    groupService.getChatAudienceUserIds.mockResolvedValue([
      'teacher-1',
      'student-1',
    ]);
    chatService.createMessage.mockResolvedValue({
      messageId: 'message-1',
      groupId: 'group-1',
      nickname: '조용한 고래',
      content: '안녕하세요',
      sentAt: '2026-04-12T12:00:00.000Z',
    });
    (chatGateway as unknown as { server: unknown }).server = {
      in: jest.fn().mockReturnValue({
        fetchSockets: jest.fn().mockResolvedValue([authorizedSocket, staleSocket]),
      }),
    };

    await chatGateway.handleSendMessage(
      senderSocket as never,
      {
        content: '안녕하세요',
      },
    );

    expect(authorizedSocket.emit).toHaveBeenCalledWith('chat.message', {
      messageId: 'message-1',
      groupId: 'group-1',
      nickname: '조용한 고래',
      content: '안녕하세요',
      sentAt: '2026-04-12T12:00:00.000Z',
    });
    expect(staleSocket.leave).toHaveBeenCalledWith('group-1');
    expect(staleSocket.data.groupId).toBeUndefined();
    expect(staleSocket.data.nickname).toBeUndefined();
  });

  it('rejects send before join', async () => {
    await expect(
      chatGateway.handleSendMessage(
        {
          data: {
            currentUser: {
              sub: 'student-1',
              email: 'student@example.com',
              role: 'student',
            },
            recentMessageTimestamps: [],
          },
        } as never,
        {
          content: '안녕하세요',
        },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
