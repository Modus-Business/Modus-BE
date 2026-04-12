import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { GroupModule } from '../group/group.module';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { ChatMessage } from './entities/chat-message.entity';

@Module({
  imports: [AuthModule, GroupModule, TypeOrmModule.forFeature([ChatMessage])],
  providers: [ChatGateway, ChatService],
})
export class ChatModule {}
