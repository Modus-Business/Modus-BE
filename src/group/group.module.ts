import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { ClassParticipant } from '../class/entities/class-participant.entity';
import { Classroom } from '../class/entities/class.entity';
import { GroupController } from './group.controller';
import { GroupService } from './group.service';
import { Group } from './entities/group.entity';
import { GroupMember } from './entities/group-member.entity';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([Classroom, ClassParticipant, Group, GroupMember]),
  ],
  controllers: [GroupController],
  providers: [GroupService],
})
export class GroupModule {}
