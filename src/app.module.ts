import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { RefreshToken } from './auth/login/refresh-token/entities/refresh-token.entity';
import { User } from './auth/signup/entities/user.entity';
import { ClassModule } from './class/class.module';
import { ClassParticipant } from './class/entities/class-participant.entity';
import { Classroom } from './class/entities/class.entity';
import { GroupModule } from './group/group.module';
import { Group } from './group/entities/group.entity';
import { GroupMember } from './group/entities/group-member.entity';
import { MeModule } from './me/me.module';
import { NoticeModule } from './notice/notice.module';
import { Notice } from './notice/entities/notice.entity';
import { AssignmentModule } from './assignment/assignment.module';
import { AssignmentSubmission } from './assignment/entities/assignment-submission.entity';
import { SurveyModule } from './survey/survey.module';
import { Survey } from './survey/entities/survey.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get<string>('DB_USERNAME', 'postgres'),
        password: configService.get<string>('DB_PASSWORD', 'postgres'),
        database: configService.get<string>('DB_NAME', 'modus'),
        entities: [User, RefreshToken, Classroom, ClassParticipant, Group, GroupMember, Notice, AssignmentSubmission, Survey],
        synchronize: configService.get<string>('DB_SYNCHRONIZE', 'true') === 'true',
      }),
    }),
    AuthModule,
    ClassModule,
    GroupModule,
    NoticeModule,
    AssignmentModule,
    SurveyModule,
    MeModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
