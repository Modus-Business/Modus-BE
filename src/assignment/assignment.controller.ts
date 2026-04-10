import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { AssignmentService } from './assignment.service';
import {
  AssignmentSubmissionItemDto,
  AssignmentSubmissionStatusListResponseDto,
} from './dto/assignment-submission.response.dto';
import { SubmitAssignmentRequestDto } from './dto/submit-assignment.request.dto';

@ApiTags('assignments')
@Controller('assignments/submissions')
@UseGuards(JwtAuthGuard)
export class AssignmentController {
  constructor(private readonly assignmentService: AssignmentService) {}

  @Post()
  @ApiOperation({ summary: '수강생 모둠 결과물 제출' })
  async submitAssignment(
    @CurrentUser() currentUser: JwtPayload,
    @Body() request: SubmitAssignmentRequestDto,
  ): Promise<AssignmentSubmissionItemDto> {
    return this.assignmentService.submitAssignment(currentUser, request);
  }

  @Get('my/:groupId')
  @ApiOperation({ summary: '수강생 내 모둠 제출 조회' })
  async getMySubmission(
    @CurrentUser() currentUser: JwtPayload,
    @Param('groupId', new ParseUUIDPipe()) groupId: string,
  ): Promise<AssignmentSubmissionItemDto | null> {
    return this.assignmentService.getMySubmission(currentUser, groupId);
  }

  @Get('group/:groupId')
  @ApiOperation({ summary: '교강사 모둠 제출 여부 조회' })
  async getGroupSubmissionStatus(
    @CurrentUser() currentUser: JwtPayload,
    @Param('groupId', new ParseUUIDPipe()) groupId: string,
  ): Promise<AssignmentSubmissionStatusListResponseDto> {
    return this.assignmentService.getGroupSubmissionStatus(currentUser, groupId);
  }

  @Get('class/:classId')
  @ApiOperation({ summary: '교강사 수업 모둠별 제출 여부 조회' })
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
