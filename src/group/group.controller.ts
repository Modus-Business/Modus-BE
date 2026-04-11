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
import { CreateGroupRequestDto } from './dto/create-group.request.dto';
import { CreateGroupResponseDto } from './dto/create-group.response.dto';
import { DeleteGroupResponseDto } from './dto/delete-group.response.dto';
import {
  GetGroupDetailSuccessResponseDto,
  GetGroupsByClassSuccessResponseDto,
  GroupGetExtraModels,
} from './dto/group-get.response.dto';
import { GroupDetailResponseDto } from './dto/group-detail.response.dto';
import { GroupListResponseDto } from './dto/group-list.response.dto';
import { UpdateGroupRequestDto } from './dto/update-group.request.dto';
import { GroupService } from './group.service';

@ApiTags('groups')
@ApiExtraModels(...GroupGetExtraModels)
@ApiBearerAuth('access-token')
@Controller('groups')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GroupController {
  constructor(private readonly groupService: GroupService) {}

  @Post()
  @Roles(UserRole.TEACHER)
  @ApiOperation({ summary: '교사용 모둠 생성' })
  @ApiCreatedResponse({
    description: '수업 안에 새 모둠을 생성하고 배정된 학생 정보를 반환합니다.',
    type: CreateGroupResponseDto,
  })
  @ApiErrorResponses([400, 401, 403, 404, 409, 500])
  async createGroup(
    @CurrentUser() currentUser: JwtPayload,
    @Body() request: CreateGroupRequestDto,
  ): Promise<CreateGroupResponseDto> {
    return this.groupService.createGroup(currentUser, request);
  }

  @Patch(':groupId')
  @Roles(UserRole.TEACHER)
  @ApiOperation({ summary: '교사용 모둠 수정' })
  @ApiOkResponse({
    description: '모둠 이름과 모둠 구성원을 수정한 결과를 반환합니다.',
    type: CreateGroupResponseDto,
  })
  @ApiErrorResponses([400, 401, 403, 404, 409, 500])
  async updateGroup(
    @CurrentUser() currentUser: JwtPayload,
    @Param('groupId', new ParseUUIDPipe()) groupId: string,
    @Body() request: UpdateGroupRequestDto,
  ): Promise<CreateGroupResponseDto> {
    return this.groupService.updateGroup(currentUser, groupId, request);
  }

  @Delete(':groupId')
  @Roles(UserRole.TEACHER)
  @ApiOperation({ summary: '교사용 모둠 삭제' })
  @ApiOkResponse({
    description: '지정한 모둠을 삭제합니다.',
    type: DeleteGroupResponseDto,
  })
  @ApiErrorResponses([401, 403, 404, 500])
  async deleteGroup(
    @CurrentUser() currentUser: JwtPayload,
    @Param('groupId', new ParseUUIDPipe()) groupId: string,
  ): Promise<DeleteGroupResponseDto> {
    return this.groupService.deleteGroup(currentUser, groupId);
  }

  @Get('class/:classId')
  @Roles(UserRole.TEACHER)
  @ApiOperation({ summary: '교사용 모둠 목록 조회' })
  @ApiOkResponse({
    description: '특정 수업의 모둠 목록을 반환합니다.',
    type: GetGroupsByClassSuccessResponseDto,
  })
  @ApiErrorResponses([401, 403, 404, 500])
  async getGroupsByClass(
    @CurrentUser() currentUser: JwtPayload,
    @Param('classId', new ParseUUIDPipe()) classId: string,
  ): Promise<GroupListResponseDto> {
    return this.groupService.getGroupsByClass(currentUser, classId);
  }

  @Get(':groupId')
  @ApiOperation({ summary: '모둠 상세 조회' })
  @ApiOkResponse({
    description: '모둠 상세 정보와 멤버 목록을 반환합니다.',
    type: GetGroupDetailSuccessResponseDto,
  })
  @ApiErrorResponses([401, 403, 404, 500])
  async getGroupDetail(
    @CurrentUser() currentUser: JwtPayload,
    @Param('groupId', new ParseUUIDPipe()) groupId: string,
  ): Promise<GroupDetailResponseDto> {
    return this.groupService.getGroupDetail(currentUser, groupId);
  }
}
