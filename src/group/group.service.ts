import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { UserRole } from '../auth/signup/enums/user-role.enum';
import { ClassParticipant } from '../class/entities/class-participant.entity';
import { Classroom } from '../class/entities/class.entity';
import { CreateGroupRequestDto } from './dto/create-group.request.dto';
import { CreateGroupResponseDto } from './dto/create-group.response.dto';
import { GroupDetailResponseDto } from './dto/group-detail.response.dto';
import { GroupListResponseDto } from './dto/group-list.response.dto';
import { MyGroupResponseDto } from './dto/my-group.response.dto';
import { Group } from './entities/group.entity';
import { GroupMember } from './entities/group-member.entity';

@Injectable()
export class GroupService {
  constructor(
    @InjectRepository(Classroom)
    private readonly classroomRepository: Repository<Classroom>,
    @InjectRepository(ClassParticipant)
    private readonly classParticipantRepository: Repository<ClassParticipant>,
    @InjectRepository(Group)
    private readonly groupRepository: Repository<Group>,
    @InjectRepository(GroupMember)
    private readonly groupMemberRepository: Repository<GroupMember>,
  ) {}

  async createGroup(
    currentUser: JwtPayload,
    request: CreateGroupRequestDto,
  ): Promise<CreateGroupResponseDto> {
    if (currentUser.role !== UserRole.TEACHER) {
      throw new ForbiddenException('교강사만 모둠을 생성할 수 있습니다.');
    }

    const classroom = await this.classroomRepository.findOne({
      where: {
        classId: request.classId,
      },
    });

    if (!classroom) {
      throw new NotFoundException('해당 수업을 찾을 수 없습니다.');
    }

    if (classroom.teacherId !== currentUser.sub) {
      throw new ForbiddenException(
        '본인이 만든 수업의 모둠만 생성할 수 있습니다.',
      );
    }

    const studentIds = request.studentIds ?? [];
    const participants =
      studentIds.length > 0
        ? await this.classParticipantRepository.find({
            where: {
              classId: request.classId,
              studentId: In(studentIds),
            },
          })
        : [];

    if (participants.length !== studentIds.length) {
      throw new NotFoundException(
        '일부 수강생이 이 수업에 참여하지 않았습니다.',
      );
    }

    if (participants.length > 0) {
      const existingGroupMembers = await this.groupMemberRepository.find({
        where: {
          classParticipantId: In(
            participants.map(
              (classParticipant) => classParticipant.classParticipantId,
            ),
          ),
        },
      });

      if (existingGroupMembers.length > 0) {
        throw new ConflictException(
          '이미 다른 모둠에 배정된 수강생이 있습니다.',
        );
      }
    }

    const group = this.groupRepository.create({
      classId: request.classId,
      name: request.name.trim(),
    });
    const savedGroup = await this.groupRepository.save(group);

    if (participants.length > 0) {
      const groupMembers = participants.map((classParticipant) =>
        this.groupMemberRepository.create({
          groupId: savedGroup.groupId,
          classParticipantId: classParticipant.classParticipantId,
        }),
      );

      await this.groupMemberRepository.save(groupMembers);
    }

    return {
      groupId: savedGroup.groupId,
      classId: savedGroup.classId,
      name: savedGroup.name,
      memberCount: participants.length,
      createdAt: savedGroup.createdAt,
    };
  }

  async getGroupsByClass(
    currentUser: JwtPayload,
    classId: string,
  ): Promise<GroupListResponseDto> {
    if (currentUser.role !== UserRole.TEACHER) {
      throw new ForbiddenException('교강사만 모둠 목록을 조회할 수 있습니다.');
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
      throw new ForbiddenException(
        '본인이 만든 수업의 모둠만 조회할 수 있습니다.',
      );
    }

    const groups = await this.groupRepository.find({
      where: {
        classId,
      },
      relations: {
        groupMembers: true,
      },
      order: {
        createdAt: 'ASC',
      },
    });

    return {
      groups: groups.map((group) => ({
        groupId: group.groupId,
        classId: group.classId,
        name: group.name,
        memberCount: group.groupMembers.length,
        createdAt: group.createdAt,
      })),
    };
  }

  async getMyGroup(
    currentUser: JwtPayload,
    classId: string,
  ): Promise<MyGroupResponseDto> {
    if (currentUser.role !== UserRole.STUDENT) {
      throw new ForbiddenException('수강생만 내 모둠을 조회할 수 있습니다.');
    }

    const classParticipant = await this.classParticipantRepository.findOne({
      where: {
        classId,
        studentId: currentUser.sub,
      },
      relations: {
        groupMember: {
          group: {
            groupMembers: true,
          },
        },
      },
    });

    if (!classParticipant) {
      throw new NotFoundException('해당 수업 참여 정보를 찾을 수 없습니다.');
    }

    if (!classParticipant.groupMember) {
      return {
        hasGroup: false,
        group: null,
        message: '참여 중인 모둠이 없습니다.',
      };
    }

    return {
      hasGroup: true,
      group: {
        groupId: classParticipant.groupMember.groupId,
        classId: classParticipant.groupMember.group.classId,
        name: classParticipant.groupMember.group.name,
        memberCount: classParticipant.groupMember.group.groupMembers.length,
      },
      message: null,
    };
  }

  async getGroupDetail(
    currentUser: JwtPayload,
    groupId: string,
  ): Promise<GroupDetailResponseDto> {
    const group = await this.groupRepository.findOne({
      where: {
        groupId,
      },
      relations: {
        classroom: true,
        groupMembers: {
          classParticipant: {
            student: true,
          },
        },
      },
      order: {
        groupMembers: {
          joinedAt: 'ASC',
        },
      },
    });

    if (!group) {
      throw new NotFoundException('해당 모둠을 찾을 수 없습니다.');
    }

    if (currentUser.role === UserRole.TEACHER) {
      if (group.classroom.teacherId !== currentUser.sub) {
        throw new ForbiddenException(
          '본인이 만든 수업의 모둠만 상세 조회할 수 있습니다.',
        );
      }

      return {
        groupId: group.groupId,
        classId: group.classId,
        name: group.name,
        memberCount: group.groupMembers.length,
        members: group.groupMembers.map((groupMember) => ({
          groupMemberId: groupMember.groupMemberId,
          displayName: groupMember.classParticipant.student.name,
          isMe: false,
        })),
      };
    }

    if (currentUser.role === UserRole.STUDENT) {
      const isMember = group.groupMembers.some(
        (groupMember) =>
          groupMember.classParticipant.studentId === currentUser.sub,
      );

      if (!isMember) {
        throw new ForbiddenException('본인이 속한 모둠만 상세 조회할 수 있습니다.');
      }

      return {
        groupId: group.groupId,
        classId: group.classId,
        name: group.name,
        memberCount: group.groupMembers.length,
        members: group.groupMembers.map((groupMember, index) => ({
          groupMemberId: groupMember.groupMemberId,
          displayName: `모둠원 ${index + 1}`,
          isMe: groupMember.classParticipant.studentId === currentUser.sub,
        })),
      };
    }

    throw new ForbiddenException('지원하지 않는 사용자 역할입니다.');
  }
}
