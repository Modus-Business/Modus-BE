import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiExtraModels,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { UserRole } from '../auth/signup/enums/user-role.enum';
import { AssignmentService } from './assignment.service';
import {
  AssignmentGetExtraModels,
  GetClassSubmissionStatusesSuccessResponseDto,
  GetMySubmissionSuccessResponseDto,
} from './dto/assignment-get.response.dto';
import {
  AssignmentSubmissionItemDto,
  AssignmentSubmissionStatusListResponseDto,
} from './dto/assignment-submission.response.dto';
import { SubmitAssignmentRequestDto } from './dto/submit-assignment.request.dto';

@ApiTags('assignments')
@ApiExtraModels(...AssignmentGetExtraModels)
@ApiBearerAuth('access-token')
@Controller('assignments/submissions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AssignmentController {
  constructor(private readonly assignmentService: AssignmentService) {}

  @Post()
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: '학생용 결과물 제출' })
  async submitAssignment(
    @CurrentUser() currentUser: JwtPayload,
    @Body() request: SubmitAssignmentRequestDto,
  ): Promise<AssignmentSubmissionItemDto> {
    return this.assignmentService.submitAssignment(currentUser, request);
  }

  @Get('my/:groupId')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: '학생용 내 제출 조회' })
  @ApiOkResponse({
    description: '현재 내 모둠의 제출 정보를 반환합니다.',
    type: GetMySubmissionSuccessResponseDto,
  })
  async getMySubmission(
    @CurrentUser() currentUser: JwtPayload,
    @Param('groupId', new ParseUUIDPipe()) groupId: string,
  ): Promise<AssignmentSubmissionItemDto | null> {
    return this.assignmentService.getMySubmission(currentUser, groupId);
  }

  @Get('class/:classId')
  @Roles(UserRole.TEACHER)
  @ApiOperation({ summary: '교사용 수업 제출 현황 조회' })
  @ApiOkResponse({
    description: '수업 안 각 모둠의 제출 현황을 반환합니다.',
    type: GetClassSubmissionStatusesSuccessResponseDto,
  })
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
