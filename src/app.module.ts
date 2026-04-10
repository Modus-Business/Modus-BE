import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ClassModule } from './class/class.module';
import { GroupModule } from './group/group.module';
import { MeModule } from './me/me.module';
import { NoticeModule } from './notice/notice.module';
import { AssignmentModule } from './assignment/assignment.module';
import { StorageModule } from './storage/storage.module';
import { SurveyModule } from './survey/survey.module';
import { createTypeOrmOptions } from './database/typeorm.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      useFactory: () => createTypeOrmOptions(process.env),
    }),
    AuthModule,
    ClassModule,
    GroupModule,
    NoticeModule,
    AssignmentModule,
    StorageModule,
    SurveyModule,
    MeModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
