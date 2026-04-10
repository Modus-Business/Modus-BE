import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { CreateGroupRequestDto } from './dto/create-group.request.dto';
import { CreateGroupResponseDto } from './dto/create-group.response.dto';
import { DeleteGroupResponseDto } from './dto/delete-group.response.dto';
import { GroupDetailResponseDto } from './dto/group-detail.response.dto';
import { GroupListResponseDto } from './dto/group-list.response.dto';
import { MyGroupResponseDto } from './dto/my-group.response.dto';
import { UpdateGroupRequestDto } from './dto/update-group.request.dto';
import { GroupService } from './group.service';

@ApiTags('groups')
@Controller('groups')
@UseGuards(JwtAuthGuard)
export class GroupController {
  constructor(private readonly groupService: GroupService) {}

  @Post()
  @ApiOperation({ summary: '교강사 모둠 생성' })
  async createGroup(
    @CurrentUser() currentUser: JwtPayload,
    @Body() request: CreateGroupRequestDto,
  ): Promise<CreateGroupResponseDto> {
    return this.groupService.createGroup(currentUser, request);
  }

  @Patch(':groupId')
  @ApiOperation({ summary: '교강사 모둠 수정' })
  async updateGroup(
    @CurrentUser() currentUser: JwtPayload,
    @Param('groupId', new ParseUUIDPipe()) groupId: string,
    @Body() request: UpdateGroupRequestDto,
  ): Promise<CreateGroupResponseDto> {
    return this.groupService.updateGroup(currentUser, groupId, request);
  }

  @Delete(':groupId')
  @ApiOperation({ summary: '교강사 모둠 삭제' })
  async deleteGroup(
    @CurrentUser() currentUser: JwtPayload,
    @Param('groupId', new ParseUUIDPipe()) groupId: string,
  ): Promise<DeleteGroupResponseDto> {
    return this.groupService.deleteGroup(currentUser, groupId);
  }

  @Get('class/:classId')
  @ApiOperation({ summary: '교강사 모둠 목록 조회' })
  async getGroupsByClass(
    @CurrentUser() currentUser: JwtPayload,
    @Param('classId', new ParseUUIDPipe()) classId: string,
  ): Promise<GroupListResponseDto> {
    return this.groupService.getGroupsByClass(currentUser, classId);
  }

  @Get('my/:classId')
  @ApiOperation({ summary: '수강생 내 모둠 조회' })
  async getMyGroup(
    @CurrentUser() currentUser: JwtPayload,
    @Param('classId', new ParseUUIDPipe()) classId: string,
  ): Promise<MyGroupResponseDto> {
    return this.groupService.getMyGroup(currentUser, classId);
  }

  @Get(':groupId')
  @ApiOperation({ summary: '모둠 상세 조회' })
  async getGroupDetail(
    @CurrentUser() currentUser: JwtPayload,
    @Param('groupId', new ParseUUIDPipe()) groupId: string,
  ): Promise<GroupDetailResponseDto> {
    return this.groupService.getGroupDetail(currentUser, groupId);
  }
}
