import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Group } from '../group/entities/group.entity';
import { NoticeController } from './notice.controller';
import { NoticeService } from './notice.service';
import { Notice } from './entities/notice.entity';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([Notice, Group])],
  controllers: [NoticeController],
  providers: [NoticeService],
})
export class NoticeModule {}
