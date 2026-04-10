import {
  Body,
  Controller,
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
  getSchemaPath,
} from '@nestjs/swagger';
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
@ApiExtraModels(ClassesResponseDto)
@ApiBearerAuth('access-token')
@Controller('classes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClassController {
  constructor(private readonly classService: ClassService) {}

  @Get()
  @ApiOperation({ summary: '메인 화면 수업 목록 조회' })
  @ApiOkResponse({
    description: '학생 또는 교강사의 메인 화면 수업 목록을 반환합니다.',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        statusCode: { type: 'number', example: 200 },
        data: { $ref: getSchemaPath(ClassesResponseDto) },
        timestamp: {
          type: 'string',
          format: 'date-time',
          example: '2026-04-11T12:00:00.000Z',
        },
        path: { type: 'string', example: '/classes' },
      },
    },
  })
  async getClasses(
    @CurrentUser() currentUser: JwtPayload,
  ): Promise<ClassesResponseDto> {
    return this.classService.getClasses(currentUser);
  }

  @Post()
  @Roles(UserRole.TEACHER)
  @ApiOperation({ summary: '교강사 수업 생성' })
  @ApiCreatedResponse({
    description: '새 수업을 생성하고 수업 코드를 반환합니다.',
    type: CreateClassResponseDto,
  })
  async createClass(
    @CurrentUser() currentUser: JwtPayload,
    @Body() request: CreateClassRequestDto,
  ): Promise<CreateClassResponseDto> {
    return this.classService.createClass(currentUser, request);
  }

  @Patch(':classId/code')
  @Roles(UserRole.TEACHER)
  @ApiOperation({ summary: '교강사 수업 코드 재발급' })
  @ApiOkResponse({
    description: '수업 코드를 새 값으로 재발급합니다.',
    type: RegenerateClassCodeResponseDto,
  })
  async regenerateClassCode(
    @CurrentUser() currentUser: JwtPayload,
    @Param('classId', new ParseUUIDPipe()) classId: string,
  ): Promise<RegenerateClassCodeResponseDto> {
    return this.classService.regenerateClassCode(currentUser, classId);
  }

  @Post('join')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: '수강생 수업 참여' })
  @ApiCreatedResponse({
    description: '수업 코드로 수업에 참여합니다.',
    type: JoinClassResponseDto,
  })
  async joinClass(
    @CurrentUser() currentUser: JwtPayload,
    @Body() request: JoinClassRequestDto,
  ): Promise<JoinClassResponseDto> {
    return this.classService.joinClass(currentUser, request);
  }
}
