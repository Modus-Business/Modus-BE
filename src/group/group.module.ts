import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { User } from '../auth/signup/entities/user.entity';
import { ChatRoomModule } from '../chat/chat-room.module';
import { ClassParticipant } from '../class/entities/class-participant.entity';
import { Classroom } from '../class/entities/class.entity';
import { OpenAiModule } from '../openai/openai.module';
import { Survey } from '../survey/entities/survey.entity';
import { GroupController } from './group.controller';
import { GroupService } from './group.service';
import { Group } from './entities/group.entity';
import { GroupMember } from './entities/group-member.entity';
import { GroupNickname } from './entities/group-nickname.entity';
import { NicknameReservation } from './entities/nickname-reservation.entity';

@Module({
  imports: [
    AuthModule,
    ChatRoomModule,
    OpenAiModule,
    TypeOrmModule.forFeature([
      Classroom,
      ClassParticipant,
      User,
      Survey,
      Group,
      GroupMember,
      GroupNickname,
      NicknameReservation,
    ]),
  ],
  controllers: [GroupController],
  providers: [GroupService],
  exports: [GroupService],
})
export class GroupModule {}
