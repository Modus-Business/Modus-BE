import {
  Body,
  Controller,
  Get,
  Patch,
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
import { ClassService } from './class.service';
import { ClassesResponseDto } from './dto/classes.response.dto';
import { CreateClassRequestDto } from './dto/create-class.request.dto';
import { CreateClassResponseDto } from './dto/create-class.response.dto';
import { JoinClassRequestDto } from './dto/join-class.request.dto';
import { JoinClassResponseDto } from './dto/join-class.response.dto';
import { RegenerateClassCodeResponseDto } from './dto/regenerate-class-code.response.dto';

@ApiTags('classes')
@ApiBearerAuth('access-token')
@Controller('classes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClassController {
  constructor(private readonly classService: ClassService) {}

  @Get()
  @ApiOperation({ summary: '메인 화면 수업 목록 조회' })
  async getClasses(
    @CurrentUser() currentUser: JwtPayload,
  ): Promise<ClassesResponseDto> {
    return this.classService.getClasses(currentUser);
  }

  @Post()
  @Roles(UserRole.TEACHER)
  @ApiOperation({ summary: '교강사 수업 생성' })
  async createClass(
    @CurrentUser() currentUser: JwtPayload,
    @Body() request: CreateClassRequestDto,
  ): Promise<CreateClassResponseDto> {
    return this.classService.createClass(currentUser, request);
  }

  @Patch(':classId/code')
  @Roles(UserRole.TEACHER)
  @ApiOperation({ summary: '교강사 수업 코드 재발급' })
  async regenerateClassCode(
    @CurrentUser() currentUser: JwtPayload,
    @Param('classId', new ParseUUIDPipe()) classId: string,
  ): Promise<RegenerateClassCodeResponseDto> {
    return this.classService.regenerateClassCode(currentUser, classId);
  }

  @Post('join')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: '수강생 수업 참여' })
  async joinClass(
    @CurrentUser() currentUser: JwtPayload,
    @Body() request: JoinClassRequestDto,
  ): Promise<JoinClassResponseDto> {
    return this.classService.joinClass(currentUser, request);
  }
}
