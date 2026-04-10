import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Classroom } from '../class/entities/class.entity';
import { Group } from '../group/entities/group.entity';
import { AssignmentController } from './assignment.controller';
import { AssignmentService } from './assignment.service';
import { AssignmentSubmission } from './entities/assignment-submission.entity';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([AssignmentSubmission, Group, Classroom]),
  ],
  controllers: [AssignmentController],
  providers: [AssignmentService],
})
export class AssignmentModule {}
