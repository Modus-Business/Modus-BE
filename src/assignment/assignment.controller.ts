import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { UserRole } from '../auth/signup/enums/user-role.enum';
import { AssignmentService } from './assignment.service';
import {
  AssignmentSubmissionItemDto,
  AssignmentSubmissionStatusListResponseDto,
} from './dto/assignment-submission.response.dto';
import { SubmitAssignmentRequestDto } from './dto/submit-assignment.request.dto';

@ApiTags('assignments')
@ApiBearerAuth('access-token')
@Controller('assignments/submissions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AssignmentController {
  constructor(private readonly assignmentService: AssignmentService) {}

  @Post()
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: '수강생 모둠 결과물 제출' })
  async submitAssignment(
    @CurrentUser() currentUser: JwtPayload,
    @Body() request: SubmitAssignmentRequestDto,
  ): Promise<AssignmentSubmissionItemDto> {
    return this.assignmentService.submitAssignment(currentUser, request);
  }

  @Get('my/:groupId')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: '수강생 내 모둠 제출 조회' })
  async getMySubmission(
    @CurrentUser() currentUser: JwtPayload,
    @Param('groupId', new ParseUUIDPipe()) groupId: string,
  ): Promise<AssignmentSubmissionItemDto | null> {
    return this.assignmentService.getMySubmission(currentUser, groupId);
  }

  @Get('class/:classId')
  @Roles(UserRole.TEACHER)
  @ApiOperation({ summary: '교강사 수업 모둠별 제출 현황 조회' })
  async getClassSubmissionStatuses(
    @CurrentUser() currentUser: JwtPayload,
    @Param('classId', new ParseUUIDPipe()) classId: string,
  ): Promise<AssignmentSubmissionStatusListResponseDto> {
    return this.assignmentService.getClassSubmissionStatuses(
      currentUser,
      classId,
    );
  }
}
