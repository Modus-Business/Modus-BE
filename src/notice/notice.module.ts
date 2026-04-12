import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { ClassParticipant } from '../class/entities/class-participant.entity';
import { Classroom } from '../class/entities/class.entity';
import { NoticeController } from './notice.controller';
import { NoticeService } from './notice.service';
import { Notice } from './entities/notice.entity';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([Notice, Classroom, ClassParticipant]),
  ],
  controllers: [NoticeController],
  providers: [NoticeService],
})
export class NoticeModule {}
