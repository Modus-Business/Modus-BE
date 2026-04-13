import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, QueryFailedError, Repository } from 'typeorm';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { User } from '../auth/signup/entities/user.entity';
import { UserRole } from '../auth/signup/enums/user-role.enum';
import { ChatRoomService } from '../chat/chat-room.service';
import { ClassParticipant } from '../class/entities/class-participant.entity';
import { Classroom } from '../class/entities/class.entity';
import { OpenAiService } from '../openai/openai.service';
import { Survey } from '../survey/entities/survey.entity';
import { CreateGroupRequestDto } from './dto/create-group.request.dto';
import { CreateGroupResponseDto } from './dto/create-group.response.dto';
import { DeleteGroupResponseDto } from './dto/delete-group.response.dto';
import { GroupDetailResponseDto } from './dto/group-detail.response.dto';
import { GroupNicknameResponseDto } from './dto/group-nickname.response.dto';
import { UpdateGroupRequestDto } from './dto/update-group.request.dto';
import { GroupMember } from './entities/group-member.entity';
import { GroupNickname } from './entities/group-nickname.entity';
import { NicknameReservation } from './entities/nickname-reservation.entity';
import { Group } from './entities/group.entity';

@Injectable()
export class GroupService {
  private static readonly MAX_NICKNAME_GENERATION_ATTEMPTS = 8;

  constructor(
    @InjectRepository(Classroom)
    private readonly classroomRepository: Repository<Classroom>,
    @InjectRepository(ClassParticipant)
    private readonly classParticipantRepository: Repository<ClassParticipant>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly chatRoomService: ChatRoomService,
    private readonly openAiService: OpenAiService,
    @InjectRepository(Group)
    private readonly groupRepository: Repository<Group>,
    @InjectRepository(GroupMember)
    private readonly groupMemberRepository: Repository<GroupMember>,
    @InjectRepository(GroupNickname)
    private readonly groupNicknameRepository: Repository<GroupNickname>,
    @InjectRepository(NicknameReservation)
    private readonly nicknameReservationRepository: Repository<NicknameReservation>,
    @InjectRepository(Survey)
    private readonly surveyRepository: Repository<Survey>,
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
      throw new ForbiddenException('본인 수업의 모둠만 생성할 수 있습니다.');
    }

    const studentIds = request.studentIds ?? [];
    const participants = await this.getParticipantsForStudents(
      request.classId,
      studentIds,
    );

    const group = this.groupRepository.create({
      classId: request.classId,
      name: request.name.trim(),
    });
    const savedGroup = await this.groupRepository.save(group);

    await this.releaseParticipantsFromOtherGroups(
      participants.map((classParticipant) => classParticipant.classParticipantId),
      savedGroup.groupId,
    );

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

    await this.releaseParticipantsFromOtherGroups(participantIdsToAdd, groupId);

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
    await this.chatRoomService.syncGroupAudience(groupId);

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

    await this.chatRoomService.closeGroup(groupId);
    await this.groupRepository.remove(group);

    return {
      message: '모둠이 삭제되었습니다.',
    };
  }

  async getGroupDetail(
    currentUser: JwtPayload,
    groupId: string,
  ): Promise<GroupDetailResponseDto> {
    const group = await this.getGroupWithMembers(groupId);

    if (currentUser.role === UserRole.TEACHER) {
      if (group.classroom.teacherId !== currentUser.sub) {
        throw new ForbiddenException(
          '본인 수업의 모둠만 상세 조회할 수 있습니다.',
        );
      }

      return {
        groupId: group.groupId,
        classId: group.classId,
        classCode: group.classroom.classCode,
        name: group.name,
        memberCount: group.groupMembers.length,
        members: group.groupMembers.map((groupMember) => ({
          groupMemberId: groupMember.groupMemberId,
          displayName: groupMember.classParticipant.student.name,
          isMe: false,
        })),
      };
    }

    if (currentUser.role !== UserRole.STUDENT) {
      throw new ForbiddenException('학생 또는 교강사만 모둠을 조회할 수 있습니다.');
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
      classCode: group.classroom.classCode,
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

  async getChatParticipantInfo(
    currentUser: JwtPayload,
    groupId: string,
  ): Promise<{ groupId: string; nickname: string }> {
    const group = await this.getGroupWithMembers(groupId);

    if (currentUser.role === UserRole.TEACHER) {
      if (group.classroom.teacherId !== currentUser.sub) {
        throw new ForbiddenException(
          '본인 수업의 그룹 채팅만 입장할 수 있습니다.',
        );
      }

      const teacher = await this.userRepository.findOne({
        where: {
          userId: currentUser.sub,
        },
      });

      if (!teacher) {
        throw new NotFoundException('교사 정보를 찾을 수 없습니다.');
      }

      return {
        groupId: group.groupId,
        nickname: teacher.name,
      };
    }

    if (currentUser.role !== UserRole.STUDENT) {
      throw new ForbiddenException('학생 또는 교사만 그룹 채팅에 입장할 수 있습니다.');
    }

    const myGroupMember = group.groupMembers.find(
      (groupMember) => groupMember.classParticipant.studentId === currentUser.sub,
    );

    if (!myGroupMember) {
      throw new ForbiddenException('본인이 속한 그룹 채팅만 입장할 수 있습니다.');
    }

    return {
      groupId: group.groupId,
      nickname:
        myGroupMember.classParticipant.groupNickname?.nickname ??
        myGroupMember.classParticipant.student.name,
    };
  }

  async getChatAudienceUserIds(groupId: string): Promise<string[]> {
    const group = await this.groupRepository.findOne({
      where: {
        groupId,
      },
      relations: {
        classroom: true,
        groupMembers: {
          classParticipant: true,
        },
      },
    });

    if (!group) {
      throw new NotFoundException('해당 그룹을 찾을 수 없습니다.');
    }

    return [
      group.classroom.teacherId,
      ...group.groupMembers.map(
        (groupMember) => groupMember.classParticipant.studentId,
      ),
    ];
  }

  async getMyGroupNickname(
    currentUser: JwtPayload,
    groupId: string,
  ): Promise<GroupNicknameResponseDto> {
    const group = await this.getGroupWithMembers(groupId);

    if (currentUser.role === UserRole.TEACHER) {
      if (group.classroom.teacherId !== currentUser.sub) {
        throw new ForbiddenException('본인 수업의 그룹만 조회할 수 있습니다.');
      }

      const teacher = await this.userRepository.findOne({
        where: {
          userId: currentUser.sub,
        },
      });

      if (!teacher) {
        throw new NotFoundException('교사 정보를 찾을 수 없습니다.');
      }

      return {
        groupId: group.groupId,
        nickname: teacher.name,
        reason: '교사는 익명 닉네임 대신 실명을 사용합니다.',
      };
    }

    if (currentUser.role !== UserRole.STUDENT) {
      throw new ForbiddenException('학생 또는 교강사만 닉네임을 조회할 수 있습니다.');
    }

    const myGroupMember = group.groupMembers.find(
      (groupMember) => groupMember.classParticipant.studentId === currentUser.sub,
    );

    if (!myGroupMember) {
      throw new ForbiddenException('본인이 속한 그룹의 닉네임만 조회할 수 있습니다.');
    }

    return {
      groupId: group.groupId,
      nickname:
        myGroupMember.classParticipant.groupNickname?.nickname ??
        myGroupMember.classParticipant.student.name,
      reason:
        myGroupMember.classParticipant.groupNickname?.nicknameReason ??
        '설문 응답을 바탕으로 만든 익명 닉네임이에요.',
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
    const participantsWithoutNickname = participants.filter(
      (classParticipant) =>
        !existingNicknameMap.has(classParticipant.classParticipantId),
    );

    if (participantsWithoutNickname.length === 0) {
      return;
    }

    const surveys = await this.surveyRepository.find({
      where: {
        userId: In(
          participantsWithoutNickname.map(
            (classParticipant) => classParticipant.studentId,
          ),
        ),
      },
    });
    const surveyMap = new Map(surveys.map((survey) => [survey.userId, survey]));
    const generatedInBatch = new Set<string>();
    const nicknamesToCreate: GroupNickname[] = [];

    for (const classParticipant of participantsWithoutNickname) {
      const generatedNickname = await this.generateAndReserveUniqueNickname(
        surveyMap.get(classParticipant.studentId) ?? null,
        generatedInBatch,
      );

      nicknamesToCreate.push(
        this.groupNicknameRepository.create({
          classId,
          classParticipantId: classParticipant.classParticipantId,
          nickname: generatedNickname.nickname,
          nicknameReason: generatedNickname.reason,
        }),
      );
    }

    if (nicknamesToCreate.length > 0) {
      await this.groupNicknameRepository.save(nicknamesToCreate);
    }
  }

  private async generateAndReserveUniqueNickname(
    survey: Survey | null,
    generatedInBatch: Set<string>,
  ): Promise<{ nickname: string; reason: string }> {
    const attemptedNicknames: string[] = [];

    for (
      let attempt = 0;
      attempt < GroupService.MAX_NICKNAME_GENERATION_ATTEMPTS;
      attempt += 1
    ) {
      const generatedNickname = await this.openAiService.generateStudentNickname({
        survey,
        attemptedNicknames,
      });
      const nickname = this.normalizeNickname(generatedNickname.nickname);
      const reason = this.normalizeReason(generatedNickname.reason);

      if (!this.isValidNickname(nickname) || !this.isValidReason(reason)) {
        attemptedNicknames.push(nickname);
        continue;
      }

      if (generatedInBatch.has(nickname)) {
        attemptedNicknames.push(nickname);
        continue;
      }

      try {
        await this.nicknameReservationRepository.insert({
          nickname,
        });
        generatedInBatch.add(nickname);
        return {
          nickname,
          reason,
        };
      } catch (error) {
        if (this.isDuplicateNicknameReservationError(error)) {
          attemptedNicknames.push(nickname);
          continue;
        }

        throw error;
      }
    }

    throw new InternalServerErrorException(
      '중복되지 않는 AI 닉네임 생성에 반복 실패했습니다.',
    );
  }

  private normalizeReason(reason: string): string {
    return reason.replace(/\s+/g, ' ').trim();
  }

  private normalizeNickname(nickname: string): string {
    return nickname.replace(/\s+/g, ' ').trim();
  }

  private isValidNickname(nickname: string): boolean {
    return (
      nickname.length >= 2 &&
      nickname.length <= 30 &&
      /^[A-Za-z0-9가-힣 ]+$/.test(nickname)
    );
  }

  private isValidReason(reason: string): boolean {
    return (
      reason.length >= 5 &&
      reason.length <= 60 &&
      /^[A-Za-z0-9가-힣 .,!?]+$/.test(reason)
    );
  }

  private isDuplicateNicknameReservationError(error: unknown): boolean {
    if (!(error instanceof QueryFailedError)) {
      return false;
    }

    const driverError = error.driverError as { code?: string } | undefined;

    return driverError?.code === '23505';
  }

  private async getTeacherOwnedGroup(
    currentUser: JwtPayload,
    groupId: string,
  ): Promise<Group> {
    if (currentUser.role !== UserRole.TEACHER) {
      throw new ForbiddenException('교강사만 모둠을 관리할 수 있습니다.');
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

  private async releaseParticipantsFromOtherGroups(
    classParticipantIds: string[],
    targetGroupId: string | null,
  ): Promise<void> {
    if (classParticipantIds.length === 0) {
      return;
    }

    const existingGroupMembers = await this.groupMemberRepository.find({
      where: {
        classParticipantId: In(classParticipantIds),
      },
    });

    const membersToMove = existingGroupMembers.filter(
      (groupMember) => groupMember.groupId !== targetGroupId,
    );

    if (membersToMove.length > 0) {
      await this.groupMemberRepository.remove(membersToMove);
    }
  }
}
