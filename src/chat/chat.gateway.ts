import {
  ConnectedSocket,
  MessageBody,
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
import { Server, Socket } from 'socket.io';
import { WsExceptionFilter } from '../common/filters/ws-exception.filter';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { TokenService } from '../auth/login/token/token.service';
import { GroupService } from '../group/group.service';
import { ChatService } from './chat.service';
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
    origin: true,
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
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly chatService: ChatService,
    private readonly tokenService: TokenService,
    private readonly groupService: GroupService,
  ) {}

  handleConnection(client: ChatSocket): void {
    try {
      client.data.currentUser = this.authenticateClient(client);
    } catch (error) {
      this.emitConnectionError(client, error);
      client.disconnect();
      return;
    }

    client.data.recentMessageTimestamps = [];
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
      participant.nickname,
      payload.content,
    );

    client.data.nickname = participant.nickname;
    this.server.to(participant.groupId).emit('chat.message', message);
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

  private emitConnectionError(client: ChatSocket, exception: unknown): void {
    const statusCode =
      exception instanceof UnauthorizedException ? exception.getStatus() : 500;
    const exceptionResponse =
      exception instanceof UnauthorizedException ? exception.getResponse() : null;
    const message =
      typeof exceptionResponse === 'object' &&
      exceptionResponse &&
      'message' in exceptionResponse
        ? (exceptionResponse as { message: string | string[] }).message
        : '웹소켓 연결 중 오류가 발생했습니다.';
    const error =
      typeof exceptionResponse === 'object' &&
      exceptionResponse &&
      'error' in exceptionResponse
        ? String((exceptionResponse as { error?: unknown }).error)
        : 'Unauthorized';

    client.emit('chat.error', {
      success: false,
      statusCode,
      message,
      error,
      timestamp: new Date().toISOString(),
      event: 'connection',
    });
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
}
