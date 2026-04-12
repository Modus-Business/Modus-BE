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
  BadRequestException,
  Logger,
  UnauthorizedException,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { Server, Socket } from 'socket.io';
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
  };
};

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
    client.data.currentUser = this.authenticateClient(client);
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
    const groupId = client.data.groupId;
    const nickname = client.data.nickname;

    if (!groupId || !nickname) {
      throw new BadRequestException('chat.join 이후에만 메시지를 전송할 수 있습니다.');
    }

    const message = await this.chatService.createMessage(
      groupId,
      nickname,
      payload.content,
    );

    this.server.to(groupId).emit('chat.message', message);
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
}
