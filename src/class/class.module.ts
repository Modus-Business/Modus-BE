import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { ClassController } from './class.controller';
import { ClassService } from './class.service';
import { ClassParticipant } from './entities/class-participant.entity';
import { Classroom } from './entities/class.entity';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([Classroom, ClassParticipant]),
  ],
  controllers: [ClassController],
  providers: [ClassService],
})
export class ClassModule {}
