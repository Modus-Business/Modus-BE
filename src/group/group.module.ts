import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { User } from '../auth/signup/entities/user.entity';
import { ChatRoomModule } from '../chat/chat-room.module';
import { ClassParticipant } from '../class/entities/class-participant.entity';
import { Classroom } from '../class/entities/class.entity';
import { GroupController } from './group.controller';
import { GroupService } from './group.service';
import { Group } from './entities/group.entity';
import { GroupMember } from './entities/group-member.entity';
import { GroupNickname } from './entities/group-nickname.entity';

@Module({
  imports: [
    AuthModule,
    ChatRoomModule,
    TypeOrmModule.forFeature([
      Classroom,
      ClassParticipant,
      User,
      Group,
      GroupMember,
      GroupNickname,
    ]),
  ],
  controllers: [GroupController],
  providers: [GroupService],
  exports: [GroupService],
})
export class GroupModule {}
