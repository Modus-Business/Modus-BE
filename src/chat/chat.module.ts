import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { GroupModule } from '../group/group.module';
import { OpenAiModule } from '../openai/openai.module';
import { ChatController } from './chat.controller';
import { ChatRoomModule } from './chat-room.module';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { ChatMessage } from './entities/chat-message.entity';

@Module({
  imports: [
    AuthModule,
    ChatRoomModule,
    GroupModule,
    OpenAiModule,
    TypeOrmModule.forFeature([ChatMessage]),
  ],
  controllers: [ChatController],
  providers: [ChatGateway, ChatService],
})
export class ChatModule {}
