import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomInt } from 'node:crypto';
import { In, Repository } from 'typeorm';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { UserRole } from '../auth/signup/enums/user-role.enum';
import { ClassParticipant } from '../class/entities/class-participant.entity';
import { Classroom } from '../class/entities/class.entity';
import { CreateGroupRequestDto } from './dto/create-group.request.dto';
import { CreateGroupResponseDto } from './dto/create-group.response.dto';
import { DeleteGroupResponseDto } from './dto/delete-group.response.dto';
import { GroupDetailResponseDto } from './dto/group-detail.response.dto';
import { GroupListResponseDto } from './dto/group-list.response.dto';
import { UpdateGroupRequestDto } from './dto/update-group.request.dto';
import { GroupMember } from './entities/group-member.entity';
import { GroupNickname } from './entities/group-nickname.entity';
import { Group } from './entities/group.entity';

const GROUP_NICKNAME_ADJECTIVES = [
  '빠른',
  '조용한',
  '반짝이는',
  '느긋한',
  '부드러운',
  '따뜻한',
  '기민한',
  '영리한',
  '차분한',
  '맑은',
];

const GROUP_NICKNAME_NOUNS = [
  '파도',
  '해변',
  '호수',
  '별빛',
  '유성',
  '메아리',
  '고래',
  '구름',
  '온도',
  '노을',
];

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
    @InjectRepository(GroupNickname)
    private readonly groupNicknameRepository: Repository<GroupNickname>,
  ) {}

  async createGroup(
    currentUser: JwtPayload,
    request: CreateGroupRequestDto,
  ): Promise<CreateGroupResponseDto> {
    if (currentUser.role !== UserRole.TEACHER) {
      throw new ForbiddenException('교사만 모둠을 생성할 수 있습니다.');
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
      throw new ForbiddenException('본인 수업의 모둠만 생성할 수 있습니다.');
    }

    const studentIds = request.studentIds ?? [];
    const participants = await this.getParticipantsForStudents(
      request.classId,
      studentIds,
    );
    await this.ensureParticipantsAreAssignable(
      participants.map((classParticipant) => classParticipant.classParticipantId),
    );

    const group = this.groupRepository.create({
      classId: request.classId,
      name: request.name.trim(),
    });
    const savedGroup = await this.groupRepository.save(group);

    if (participants.length > 0) {
      await this.addParticipantsToGroup(
        savedGroup.groupId,
        request.classId,
        participants,
      );
    }

    return {
      groupId: savedGroup.groupId,
      classId: savedGroup.classId,
      name: savedGroup.name,
      memberCount: participants.length,
      createdAt: savedGroup.createdAt,
    };
  }

  async updateGroup(
    currentUser: JwtPayload,
    groupId: string,
    request: UpdateGroupRequestDto,
  ): Promise<CreateGroupResponseDto> {
    const group = await this.getTeacherOwnedGroup(currentUser, groupId);
    const studentIds = request.studentIds ?? [];
    const participants = await this.getParticipantsForStudents(
      group.classId,
      studentIds,
    );

    const currentMembers = await this.groupMemberRepository.find({
      where: {
        groupId,
      },
      order: {
        joinedAt: 'ASC',
      },
    });
    const currentParticipantIdSet = new Set(
      currentMembers.map((groupMember) => groupMember.classParticipantId),
    );
    const requestedParticipantIdSet = new Set(
      participants.map((classParticipant) => classParticipant.classParticipantId),
    );

    const participantIdsToAdd = participants
      .filter(
        (classParticipant) =>
          !currentParticipantIdSet.has(classParticipant.classParticipantId),
      )
      .map((classParticipant) => classParticipant.classParticipantId);

    await this.ensureParticipantsAreAssignable(participantIdsToAdd);

    const membersToRemove = currentMembers.filter(
      (groupMember) =>
        !requestedParticipantIdSet.has(groupMember.classParticipantId),
    );

    if (membersToRemove.length > 0) {
      await this.groupMemberRepository.remove(membersToRemove);
    }

    const participantsToAdd = participants.filter((classParticipant) =>
      participantIdsToAdd.includes(classParticipant.classParticipantId),
    );

    if (participantsToAdd.length > 0) {
      await this.addParticipantsToGroup(
        groupId,
        group.classId,
        participantsToAdd,
      );
    }

    group.name = request.name.trim();
    const savedGroup = await this.groupRepository.save(group);

    const memberCount = await this.groupMemberRepository.count({
      where: {
        groupId,
      },
    });

    return {
      groupId: savedGroup.groupId,
      classId: savedGroup.classId,
      name: savedGroup.name,
      memberCount,
      createdAt: savedGroup.createdAt,
    };
  }

  async deleteGroup(
    currentUser: JwtPayload,
    groupId: string,
  ): Promise<DeleteGroupResponseDto> {
    const group = await this.getTeacherOwnedGroup(currentUser, groupId);

    await this.groupRepository.remove(group);

    return {
      message: '모둠이 삭제되었습니다.',
    };
  }

  async getGroupsByClass(
    currentUser: JwtPayload,
    classId: string,
  ): Promise<GroupListResponseDto> {
    if (currentUser.role !== UserRole.TEACHER) {
      throw new ForbiddenException('교사만 모둠 목록을 조회할 수 있습니다.');
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
      throw new ForbiddenException('본인 수업의 모둠만 조회할 수 있습니다.');
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
      groups: groups.map((savedGroup) => ({
        groupId: savedGroup.groupId,
        classId: savedGroup.classId,
        name: savedGroup.name,
        memberCount: savedGroup.groupMembers.length,
        createdAt: savedGroup.createdAt,
      })),
    };
  }

  async getTeacherGroupDetail(
    currentUser: JwtPayload,
    groupId: string,
  ): Promise<GroupDetailResponseDto> {
    const group = await this.getGroupWithMembers(groupId);

    if (currentUser.role !== UserRole.TEACHER) {
      throw new ForbiddenException('교강사만 모둠을 조회할 수 있습니다.');
    }

    if (group.classroom.teacherId !== currentUser.sub) {
      throw new ForbiddenException('본인 수업의 모둠만 상세 조회할 수 있습니다.');
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

  async getStudentGroupDetail(
    currentUser: JwtPayload,
    groupId: string,
  ): Promise<GroupDetailResponseDto> {
    const group = await this.getGroupWithMembers(groupId);

    if (currentUser.role !== UserRole.STUDENT) {
      throw new ForbiddenException('학생만 모둠을 조회할 수 있습니다.');
    }

    const isMember = group.groupMembers.some(
      (groupMember) => groupMember.classParticipant.studentId === currentUser.sub,
    );

    if (!isMember) {
      throw new ForbiddenException('본인이 속한 모둠만 상세 조회할 수 있습니다.');
    }

    return {
      groupId: group.groupId,
      classId: group.classId,
      name: group.name,
      memberCount: group.groupMembers.length,
      members: group.groupMembers.map((groupMember) => ({
        groupMemberId: groupMember.groupMemberId,
        displayName:
          groupMember.classParticipant.groupNickname?.nickname ??
          '이름 없는 모둠원',
        isMe: groupMember.classParticipant.studentId === currentUser.sub,
      })),
    };
  }

  private async getGroupWithMembers(groupId: string): Promise<Group> {
    const group = await this.groupRepository.findOne({
      where: {
        groupId,
      },
      relations: {
        classroom: true,
        groupMembers: {
          classParticipant: {
            student: true,
            groupNickname: true,
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
    return group;
  }

  private async addParticipantsToGroup(
    groupId: string,
    classId: string,
    participants: ClassParticipant[],
  ): Promise<void> {
    const groupMembers = participants.map((classParticipant) =>
      this.groupMemberRepository.create({
        groupId,
        classParticipantId: classParticipant.classParticipantId,
      }),
    );
    await this.groupMemberRepository.save(groupMembers);
    await this.ensureClassScopedNicknames(classId, participants);
  }

  private async ensureClassScopedNicknames(
    classId: string,
    participants: ClassParticipant[],
  ): Promise<void> {
    if (participants.length === 0) {
      return;
    }

    const existingNicknames = await this.groupNicknameRepository.find({
      where: {
        classId,
      },
    });
    const existingNicknameMap = new Map(
      existingNicknames.map((groupNickname) => [
        groupNickname.classParticipantId,
        groupNickname.nickname,
      ]),
    );
    const usedNicknames = new Set(
      existingNicknames.map((groupNickname) => groupNickname.nickname),
    );
    const nicknamesToCreate = participants
      .filter(
        (classParticipant) =>
          !existingNicknameMap.has(classParticipant.classParticipantId),
      )
      .map((classParticipant) =>
        this.groupNicknameRepository.create({
          classId,
          classParticipantId: classParticipant.classParticipantId,
          nickname: this.generateUniqueNickname(usedNicknames),
        }),
      );

    if (nicknamesToCreate.length > 0) {
      await this.groupNicknameRepository.save(nicknamesToCreate);
    }
  }

  private generateUniqueNickname(usedNicknames: Set<string>): string {
    const totalCombinationCount =
      GROUP_NICKNAME_ADJECTIVES.length * GROUP_NICKNAME_NOUNS.length;

    while (usedNicknames.size < totalCombinationCount) {
      const nickname = `${this.pickRandom(GROUP_NICKNAME_ADJECTIVES)} ${this.pickRandom(GROUP_NICKNAME_NOUNS)}`;

      if (!usedNicknames.has(nickname)) {
        usedNicknames.add(nickname);
        return nickname;
      }
    }

    const fallbackBase = `${this.pickRandom(GROUP_NICKNAME_ADJECTIVES)} ${this.pickRandom(GROUP_NICKNAME_NOUNS)}`;
    let suffix = 2;

    while (usedNicknames.has(`${fallbackBase} ${suffix}`)) {
      suffix += 1;
    }

    const fallbackNickname = `${fallbackBase} ${suffix}`;
    usedNicknames.add(fallbackNickname);

    return fallbackNickname;
  }

  private pickRandom(values: string[]): string {
    return values[randomInt(0, values.length)];
  }

  private async getTeacherOwnedGroup(
    currentUser: JwtPayload,
    groupId: string,
  ): Promise<Group> {
    if (currentUser.role !== UserRole.TEACHER) {
      throw new ForbiddenException('교사만 모둠을 관리할 수 있습니다.');
    }

    const group = await this.groupRepository.findOne({
      where: {
        groupId,
      },
      relations: {
        classroom: true,
      },
    });

    if (!group) {
      throw new NotFoundException('해당 모둠을 찾을 수 없습니다.');
    }

    if (group.classroom.teacherId !== currentUser.sub) {
      throw new ForbiddenException('본인 수업의 모둠만 관리할 수 있습니다.');
    }

    return group;
  }

  private async getParticipantsForStudents(
    classId: string,
    studentIds: string[],
  ): Promise<ClassParticipant[]> {
    if (studentIds.length === 0) {
      return [];
    }

    const participants = await this.classParticipantRepository.find({
      where: {
        classId,
        studentId: In(studentIds),
      },
    });

    if (participants.length !== studentIds.length) {
      throw new NotFoundException(
        '일부 학생이 아직 해당 수업에 참여하지 않았습니다.',
      );
    }

    return participants;
  }

  private async ensureParticipantsAreAssignable(
    classParticipantIds: string[],
  ): Promise<void> {
    if (classParticipantIds.length === 0) {
      return;
    }

    const existingGroupMembers = await this.groupMemberRepository.find({
      where: {
        classParticipantId: In(classParticipantIds),
      },
    });

    if (existingGroupMembers.length > 0) {
      throw new ConflictException(
        '이미 다른 모둠에 배정된 학생이 포함되어 있습니다.',
      );
    }
  }
}
