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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { UserRole } from '../auth/signup/enums/user-role.enum';
import { CreateNoticeRequestDto } from './dto/create-notice.request.dto';
import { DeleteNoticeResponseDto } from './dto/delete-notice.response.dto';
import { NoticeItemDto, NoticeListResponseDto } from './dto/notice.response.dto';
import { UpdateNoticeRequestDto } from './dto/update-notice.request.dto';
import { NoticeService } from './notice.service';

@ApiTags('notices')
@ApiBearerAuth('access-token')
@Controller('notices')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NoticeController {
  constructor(private readonly noticeService: NoticeService) {}

  @Post()
  @Roles(UserRole.TEACHER)
  @ApiOperation({ summary: '교강사 공지 작성' })
  async createNotice(
    @CurrentUser() currentUser: JwtPayload,
    @Body() request: CreateNoticeRequestDto,
  ): Promise<NoticeItemDto> {
    return this.noticeService.createNotice(currentUser, request);
  }

  @Patch(':noticeId')
  @Roles(UserRole.TEACHER)
  @ApiOperation({ summary: '교강사 공지 수정' })
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
  async deleteNotice(
    @CurrentUser() currentUser: JwtPayload,
    @Param('noticeId', new ParseUUIDPipe()) noticeId: string,
  ): Promise<DeleteNoticeResponseDto> {
    return this.noticeService.deleteNotice(currentUser, noticeId);
  }

  @Get('group/:groupId')
  @ApiOperation({ summary: '모둠 공지 목록 조회' })
  async getNoticesByGroup(
    @CurrentUser() currentUser: JwtPayload,
    @Param('groupId', new ParseUUIDPipe()) groupId: string,
  ): Promise<NoticeListResponseDto> {
    return this.noticeService.getNoticesByGroup(currentUser, groupId);
  }
}
