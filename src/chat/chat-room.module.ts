import { Module } from '@nestjs/common';
import { ChatRoomService } from './chat-room.service';

@Module({
  providers: [ChatRoomService],
  exports: [ChatRoomService],
})
export class ChatRoomModule {}
