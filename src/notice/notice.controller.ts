import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
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
import { ApiErrorResponses } from '../common/decorators/api-error-responses.decorator';
import { CreateNoticeRequestDto } from './dto/create-notice.request.dto';
import { DeleteNoticeResponseDto } from './dto/delete-notice.response.dto';
import {
  GetNoticesByClassSuccessResponseDto,
  NoticeGetExtraModels,
} from './dto/notice-get.response.dto';
import { NoticeItemDto, NoticeListResponseDto } from './dto/notice.response.dto';
import { UpdateNoticeRequestDto } from './dto/update-notice.request.dto';
import { NoticeService } from './notice.service';

@ApiTags('notices')
@ApiExtraModels(...NoticeGetExtraModels)
@ApiBearerAuth('access-token')
@Controller('notices')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NoticeController {
  constructor(private readonly noticeService: NoticeService) {}

  @Post()
  @Roles(UserRole.TEACHER)
  @ApiOperation({ summary: '교강사 공지 작성' })
  @ApiCreatedResponse({
    description: '수업 공지를 새로 작성합니다.',
    type: NoticeItemDto,
  })
  @ApiErrorResponses([400, 401, 403, 404, 500])
  async createNotice(
    @CurrentUser() currentUser: JwtPayload,
    @Body() request: CreateNoticeRequestDto,
  ): Promise<NoticeItemDto> {
    return this.noticeService.createNotice(currentUser, request);
  }

  @Patch(':noticeId')
  @Roles(UserRole.TEACHER)
  @ApiOperation({ summary: '교강사 공지 수정' })
  @ApiOkResponse({
    description: '기존 공지를 수정한 결과를 반환합니다.',
    type: NoticeItemDto,
  })
  @ApiErrorResponses([400, 401, 403, 404, 500])
  async updateNotice(
    @CurrentUser() currentUser: JwtPayload,
    @Param('noticeId', new ParseUUIDPipe()) noticeId: string,
    @Body() request: UpdateNoticeRequestDto,
  ): Promise<NoticeItemDto> {
    return this.noticeService.updateNotice(currentUser, noticeId, request);
  }

  @Delete(':noticeId')
  @Roles(UserRole.TEACHER)
  @ApiOperation({ summary: '교강사 공지 삭제' })
  @ApiOkResponse({
    description: '지정한 공지를 삭제합니다.',
    type: DeleteNoticeResponseDto,
  })
  @ApiErrorResponses([401, 403, 404, 500])
  async deleteNotice(
    @CurrentUser() currentUser: JwtPayload,
    @Param('noticeId', new ParseUUIDPipe()) noticeId: string,
  ): Promise<DeleteNoticeResponseDto> {
    return this.noticeService.deleteNotice(currentUser, noticeId);
  }

  @Get('class/:classId')
  @ApiOperation({ summary: '수업 공지 목록 조회' })
  @ApiOkResponse({
    description: '특정 수업의 공지 목록을 반환합니다.',
    type: GetNoticesByClassSuccessResponseDto,
  })
  @ApiErrorResponses([401, 403, 404, 500])
  async getNoticesByClass(
    @CurrentUser() currentUser: JwtPayload,
    @Param('classId', new ParseUUIDPipe()) classId: string,
  ): Promise<NoticeListResponseDto> {
    return this.noticeService.getNoticesByClass(currentUser, classId);
  }
}
