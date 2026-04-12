import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomInt } from 'node:crypto';
import { Repository } from 'typeorm';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { UserRole } from '../auth/signup/enums/user-role.enum';
import { GroupListResponseDto } from '../group/dto/group-list.response.dto';
import { ClassParticipantsResponseDto } from './dto/class-participants.response.dto';
import { ClassesResponseDto } from './dto/classes.response.dto';
import { CreateClassRequestDto } from './dto/create-class.request.dto';
import { CreateClassResponseDto } from './dto/create-class.response.dto';
import { JoinClassRequestDto } from './dto/join-class.request.dto';
import { JoinClassResponseDto } from './dto/join-class.response.dto';
import { RegenerateClassCodeResponseDto } from './dto/regenerate-class-code.response.dto';
import { ClassParticipant } from './entities/class-participant.entity';
import { Classroom } from './entities/class.entity';

const CLASS_CODE_CHARACTERS = 'ABCDEFG0123456789';
const CLASS_CODE_BLOCK_LENGTH = 4;

@Injectable()
export class ClassService {
  constructor(
    @InjectRepository(Classroom)
    private readonly classroomRepository: Repository<Classroom>,
    @InjectRepository(ClassParticipant)
    private readonly classParticipantRepository: Repository<ClassParticipant>,
  ) {}

  async getClasses(currentUser: JwtPayload): Promise<ClassesResponseDto> {
    if (currentUser.role === UserRole.STUDENT) {
      return this.getStudentClasses(currentUser);
    }

    if (currentUser.role === UserRole.TEACHER) {
      return this.getTeacherClasses(currentUser);
    }

    throw new ForbiddenException('지원하지 않는 사용자 역할입니다.');
  }

  async getClassParticipants(
    currentUser: JwtPayload,
    classId: string,
  ): Promise<ClassParticipantsResponseDto> {
    const classroom = await this.getTeacherOwnedClassroom(currentUser, classId);

    const classParticipants = await this.classParticipantRepository.find({
      where: {
        classId,
      },
      relations: {
        student: true,
        groupMember: {
          group: true,
        },
        groupNickname: true,
      },
      order: {
        joinedAt: 'ASC',
      },
    });

    return {
      classId: classroom.classId,
      className: classroom.name,
      participants: classParticipants.map((classParticipant) => ({
        classParticipantId: classParticipant.classParticipantId,
        studentId: classParticipant.studentId,
        studentName: classParticipant.student.name,
        email: classParticipant.student.email,
        nickname: classParticipant.groupNickname?.nickname ?? null,
        group: classParticipant.groupMember
          ? {
              groupId: classParticipant.groupMember.groupId,
              name: classParticipant.groupMember.group.name,
            }
          : null,
        joinedAt: classParticipant.joinedAt,
        groupJoinedAt: classParticipant.groupMember?.joinedAt ?? null,
      })),
    };
  }

  async getClassGroups(
    currentUser: JwtPayload,
    classId: string,
  ): Promise<GroupListResponseDto> {
    const classroom = await this.classroomRepository.findOne({
      where: {
        classId,
      },
      relations: {
        groups: {
          groupMembers: true,
        },
      },
      order: {
        groups: {
          createdAt: 'ASC',
        },
      },
    });

    if (!classroom) {
      throw new NotFoundException('해당 수업을 찾을 수 없습니다.');
    }

    if (currentUser.role !== UserRole.TEACHER) {
      throw new ForbiddenException('교강사만 수업 모둠 목록을 조회할 수 있습니다.');
    }

    if (classroom.teacherId !== currentUser.sub) {
      throw new ForbiddenException('본인 수업의 모둠 목록만 조회할 수 있습니다.');
    }

    return {
      groups: classroom.groups.map((group) => ({
        groupId: group.groupId,
        classId: group.classId,
        name: group.name,
        memberCount: group.groupMembers.length,
        createdAt: group.createdAt,
      })),
    };
  }

  async createClass(
    currentUser: JwtPayload,
    request: CreateClassRequestDto,
  ): Promise<CreateClassResponseDto> {
    if (currentUser.role !== UserRole.TEACHER) {
      throw new ForbiddenException('교사만 수업을 생성할 수 있습니다.');
    }

    const classroom = this.classroomRepository.create({
      teacherId: currentUser.sub,
      name: request.name.trim(),
      description: request.description?.trim() || null,
      classCode: await this.generateUniqueClassCode(),
    });

    const savedClassroom = await this.classroomRepository.save(classroom);

    return {
      classId: savedClassroom.classId,
      name: savedClassroom.name,
      description: savedClassroom.description,
      classCode: savedClassroom.classCode,
      studentCount: 0,
      createdAt: savedClassroom.createdAt,
    };
  }

  async regenerateClassCode(
    currentUser: JwtPayload,
    classId: string,
  ): Promise<RegenerateClassCodeResponseDto> {
    const classroom = await this.getTeacherOwnedClassroom(currentUser, classId);

    classroom.classCode = await this.generateUniqueClassCode(
      classroom.classId,
      classroom.classCode,
    );

    const savedClassroom = await this.classroomRepository.save(classroom);

    return {
      classId: savedClassroom.classId,
      classCode: savedClassroom.classCode,
      updatedAt: savedClassroom.updatedAt,
    };
  }

  async joinClass(
    currentUser: JwtPayload,
    request: JoinClassRequestDto,
  ): Promise<JoinClassResponseDto> {
    if (currentUser.role !== UserRole.STUDENT) {
      throw new ForbiddenException('학생만 수업에 참여할 수 있습니다.');
    }

    const classroom = await this.classroomRepository.findOne({
      where: {
        classCode: request.classCode,
      },
    });

    if (!classroom) {
      throw new NotFoundException('해당 수업 코드를 찾을 수 없습니다.');
    }

    if (classroom.teacherId === currentUser.sub) {
      throw new ConflictException('본인이 만든 수업에는 참여할 수 없습니다.');
    }

    const existingClassParticipant =
      await this.classParticipantRepository.findOne({
        where: {
          classId: classroom.classId,
          studentId: currentUser.sub,
        },
      });

    if (existingClassParticipant) {
      throw new ConflictException('이미 참여한 수업입니다.');
    }

    const classParticipant = this.classParticipantRepository.create({
      classId: classroom.classId,
      studentId: currentUser.sub,
    });
    const savedClassParticipant =
      await this.classParticipantRepository.save(classParticipant);

    return {
      classId: classroom.classId,
      name: classroom.name,
      description: classroom.description,
      classCode: classroom.classCode,
      joinedAt: savedClassParticipant.joinedAt,
    };
  }

  private async getStudentClasses(
    currentUser: JwtPayload,
  ): Promise<ClassesResponseDto> {
    const classParticipants = await this.classParticipantRepository.find({
      where: {
        studentId: currentUser.sub,
      },
      relations: {
        classroom: true,
        groupMember: {
          group: true,
        },
      },
      order: {
        joinedAt: 'DESC',
      },
    });

    return {
      classes: classParticipants.map((classParticipant) => ({
        classId: classParticipant.classId,
        name: classParticipant.classroom.name,
        description: classParticipant.classroom.description,
        classCode: null,
        studentCount: null,
        createdAt: classParticipant.classroom.createdAt,
        myGroup: classParticipant.groupMember
          ? {
              groupId: classParticipant.groupMember.groupId,
              name: classParticipant.groupMember.group.name,
            }
          : null,
      })),
    };
  }

  private async getTeacherClasses(
    currentUser: JwtPayload,
  ): Promise<ClassesResponseDto> {
    const classrooms = await this.classroomRepository.find({
      where: {
        teacherId: currentUser.sub,
      },
      relations: {
        classParticipants: true,
      },
      order: {
        createdAt: 'DESC',
      },
    });

    return {
      classes: classrooms.map((classroom) => ({
        classId: classroom.classId,
        name: classroom.name,
        description: classroom.description,
        classCode: classroom.classCode,
        studentCount: classroom.classParticipants.length,
        createdAt: classroom.createdAt,
        myGroup: null,
      })),
    };
  }

  private async getTeacherOwnedClassroom(
    currentUser: JwtPayload,
    classId: string,
  ): Promise<Classroom> {
    if (currentUser.role !== UserRole.TEACHER) {
      throw new ForbiddenException('교사만 수업 정보를 조회할 수 있습니다.');
    }

    const classroom = await this.classroomRepository.findOne({
      where: {
        classId,
      },
    });

    if (!classroom) {
      throw new NotFoundException('해당 수업을 찾을 수 없습니다.');
    }

    if (classroom.teacherId !== currentUser.sub) {
      throw new ForbiddenException('본인 수업만 조회할 수 있습니다.');
    }

    return classroom;
  }

  private async generateUniqueClassCode(
    currentClassId?: string,
    previousClassCode?: string,
  ): Promise<string> {
    while (true) {
      const classCode = `${this.generateClassCodeBlock()}-${this.generateClassCodeBlock()}`;

      if (previousClassCode && classCode === previousClassCode) {
        continue;
      }

      const existingClassroom = await this.classroomRepository.findOne({
        where: {
          classCode,
        },
      });

      if (!existingClassroom) {
        return classCode;
      }

      if (currentClassId && existingClassroom.classId === currentClassId) {
        continue;
      }
    }
  }

  private generateClassCodeBlock(): string {
    return Array.from({ length: CLASS_CODE_BLOCK_LENGTH }, () => {
      const randomIndex = randomInt(0, CLASS_CODE_CHARACTERS.length);

      return CLASS_CODE_CHARACTERS[randomIndex];
    }).join('');
  }
}
