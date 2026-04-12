import {
  ConnectedSocket,
  MessageBody,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import {
  UseFilters,
  BadRequestException,
  Logger,
  UnauthorizedException,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Server, Socket } from 'socket.io';
import { WsExceptionFilter } from '../common/filters/ws-exception.filter';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { TokenService } from '../auth/login/token/token.service';
import { GroupService } from '../group/group.service';
import { ChatService } from './chat.service';
import { ChatMessageResponseDto } from './dto/chat-message.response.dto';
import { JoinChatRequestDto } from './dto/join-chat.request.dto';
import { SendChatMessageRequestDto } from './dto/send-chat-message.request.dto';

type ChatSocket = Socket & {
  data: {
    currentUser?: JwtPayload;
    groupId?: string;
    nickname?: string;
    recentMessageTimestamps?: number[];
  };
};

const MESSAGE_RATE_LIMIT_WINDOW_MS = 5000;
const MESSAGE_RATE_LIMIT_COUNT = 5;

@WebSocketGateway({
  namespace: '/chat',
  cors: {
    origin: [],
    credentials: true,
  },
})
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  }),
)
@UseFilters(new WsExceptionFilter())
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly chatService: ChatService,
    private readonly tokenService: TokenService,
    private readonly groupService: GroupService,
    private readonly configService: ConfigService,
  ) {}

  afterInit(server: Server): void {
    const allowedOrigins = this.getAllowedOrigins();

    server.engine.opts.cors = {
      origin: allowedOrigins,
      credentials: true,
    };
    server.use((socket, next) => {
      const origin = socket.handshake.headers.origin;

      if (origin && !allowedOrigins.includes(origin)) {
        next(new Error('허용되지 않은 origin입니다.'));
        return;
      }

      try {
        socket.data.currentUser = this.authenticateClient(socket as ChatSocket);
        socket.data.recentMessageTimestamps = [];
        next();
      } catch (error) {
        next(error instanceof Error ? error : new Error('인증에 실패했습니다.'));
      }
    });
  }

  handleConnection(client: ChatSocket): void {
    this.logger.debug(`chat client connected: ${client.id}`);
  }

  handleDisconnect(client: ChatSocket): void {
    this.logger.debug(`chat client disconnected: ${client.id}`);
  }

  @SubscribeMessage('chat.join')
  async handleJoin(
    @ConnectedSocket() client: ChatSocket,
    @MessageBody() payload: JoinChatRequestDto,
  ): Promise<void> {
    const currentUser = client.data.currentUser;

    if (!currentUser) {
      throw new UnauthorizedException('웹소켓 인증 정보가 없습니다.');
    }

    const participant = await this.groupService.getChatParticipantInfo(
      currentUser,
      payload.groupId,
    );

    if (client.data.groupId) {
      await client.leave(client.data.groupId);
    }

    client.data.groupId = participant.groupId;
    client.data.nickname = participant.nickname;
    await client.join(participant.groupId);

    client.emit('chat.joined', {
      groupId: participant.groupId,
      nickname: participant.nickname,
      joinedAt: new Date().toISOString(),
    });

    client.emit(
      'chat.history',
      await this.chatService.getRecentMessages(participant.groupId),
    );
  }

  @SubscribeMessage('chat.send')
  async handleSendMessage(
    @ConnectedSocket() client: ChatSocket,
    @MessageBody() payload: SendChatMessageRequestDto,
  ): Promise<void> {
    const currentUser = client.data.currentUser;
    const groupId = client.data.groupId;

    if (!currentUser) {
      throw new UnauthorizedException('웹소켓 인증 정보가 없습니다.');
    }

    if (!groupId) {
      throw new BadRequestException('chat.join 이후에만 메시지를 전송할 수 있습니다.');
    }

    this.enforceRateLimit(client);

    const participant = await this.groupService.getChatParticipantInfo(
      currentUser,
      groupId,
    );

    const message = await this.chatService.createMessage(
      participant.groupId,
      currentUser.sub,
      participant.nickname,
      payload.content,
    );

    client.data.nickname = participant.nickname;
    await this.emitMessageToAuthorizedSockets(participant.groupId, message);
  }

  private authenticateClient(client: ChatSocket): JwtPayload {
    const handshakeToken =
      typeof client.handshake.auth?.token === 'string'
        ? client.handshake.auth.token
        : null;
    const authorizationHeader = client.handshake.headers.authorization;
    const bearerToken =
      typeof authorizationHeader === 'string' &&
      authorizationHeader.startsWith('Bearer ')
        ? authorizationHeader.slice(7)
        : null;
    const accessToken = handshakeToken ?? bearerToken;

    if (!accessToken) {
      throw new UnauthorizedException('웹소켓 access token이 필요합니다.');
    }

    return this.tokenService.verifyAccessToken(accessToken);
  }

  private getAllowedOrigins(): string[] {
    const configuredOrigins = this.configService.get<string>('CORS_ORIGIN');

    if (!configuredOrigins) {
      return [];
    }

    return configuredOrigins
      .split(',')
      .map((origin) => origin.trim())
      .filter((origin) => origin.length > 0);
  }

  private enforceRateLimit(client: ChatSocket): void {
    const now = Date.now();
    const recentMessageTimestamps =
      client.data.recentMessageTimestamps?.filter(
        (timestamp) => now - timestamp < MESSAGE_RATE_LIMIT_WINDOW_MS,
      ) ?? [];

    if (recentMessageTimestamps.length >= MESSAGE_RATE_LIMIT_COUNT) {
      client.data.recentMessageTimestamps = recentMessageTimestamps;
      throw new BadRequestException(
        '메시지를 너무 빠르게 보내고 있습니다. 잠시 후 다시 시도해주세요.',
      );
    }

    recentMessageTimestamps.push(now);
    client.data.recentMessageTimestamps = recentMessageTimestamps;
  }

  private async emitMessageToAuthorizedSockets(
    groupId: string,
    message: ChatMessageResponseDto,
  ): Promise<void> {
    const authorizedUserIds = new Set(
      await this.groupService.getChatAudienceUserIds(groupId),
    );
    const sockets = await this.server.in(groupId).fetchSockets();

    await Promise.all(
      sockets.map(async (socket) => {
        const chatSocket = socket as unknown as ChatSocket;
        const userId = chatSocket.data.currentUser?.sub;

        if (userId && authorizedUserIds.has(userId)) {
          socket.emit('chat.message', message);
          return;
        }

        await socket.leave(groupId);

        if (chatSocket.data.groupId === groupId) {
          chatSocket.data.groupId = undefined;
          chatSocket.data.nickname = undefined;
        }
      }),
    );
  }
}
