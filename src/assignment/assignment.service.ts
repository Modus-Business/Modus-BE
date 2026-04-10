import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { UserRole } from '../auth/signup/enums/user-role.enum';
import { Classroom } from '../class/entities/class.entity';
import { Group } from '../group/entities/group.entity';
import { AssignmentSubmission } from './entities/assignment-submission.entity';
import {
  AssignmentSubmissionItemDto,
  AssignmentSubmissionStatusListResponseDto,
} from './dto/assignment-submission.response.dto';
import { SubmitAssignmentRequestDto } from './dto/submit-assignment.request.dto';

@Injectable()
export class AssignmentService {
  constructor(
    @InjectRepository(AssignmentSubmission)
    private readonly assignmentSubmissionRepository: Repository<AssignmentSubmission>,
    @InjectRepository(Group)
    private readonly groupRepository: Repository<Group>,
    @InjectRepository(Classroom)
    private readonly classroomRepository: Repository<Classroom>,
  ) {}

  async submitAssignment(
    currentUser: JwtPayload,
    request: SubmitAssignmentRequestDto,
  ): Promise<AssignmentSubmissionItemDto> {
    if (currentUser.role !== UserRole.STUDENT) {
      throw new ForbiddenException('수강생만 결과물을 제출할 수 있습니다.');
    }

    if (!request.fileUrl && !request.link) {
      throw new BadRequestException(
        'fileUrl 또는 link 중 하나는 반드시 제출해야 합니다.',
      );
    }

    const group = await this.getStudentAccessibleGroup(currentUser, request.groupId);

    let submission = await this.assignmentSubmissionRepository.findOne({
      where: {
        groupId: group.groupId,
      },
    });

    if (!submission) {
      submission = this.assignmentSubmissionRepository.create({
        groupId: group.groupId,
        fileUrl: request.fileUrl ?? null,
        link: request.link ?? null,
        submittedBy: currentUser.sub,
      });
    } else {
      submission.fileUrl = request.fileUrl ?? null;
      submission.link = request.link ?? null;
      submission.submittedBy = currentUser.sub;
    }

    const savedSubmission = await this.assignmentSubmissionRepository.save(
      submission,
    );

    return this.toSubmissionItem(savedSubmission);
  }

  async getMySubmission(
    currentUser: JwtPayload,
    groupId: string,
  ): Promise<AssignmentSubmissionItemDto | null> {
    if (currentUser.role !== UserRole.STUDENT) {
      throw new ForbiddenException('수강생만 내 모둠 제출을 조회할 수 있습니다.');
    }

    await this.getStudentAccessibleGroup(currentUser, groupId);

    const submission = await this.assignmentSubmissionRepository.findOne({
      where: {
        groupId,
      },
    });

    return submission ? this.toSubmissionItem(submission) : null;
  }

  async getClassSubmissionStatuses(
    currentUser: JwtPayload,
    classId: string,
  ): Promise<AssignmentSubmissionStatusListResponseDto> {
    if (currentUser.role !== UserRole.TEACHER) {
      throw new ForbiddenException(
        '교강사만 수업별 제출 여부를 조회할 수 있습니다.',
      );
    }

    const classroom = await this.classroomRepository.findOne({
      where: {
        classId,
      },
      relations: {
        groups: true,
      },
    });

    if (!classroom) {
      throw new NotFoundException('해당 수업을 찾을 수 없습니다.');
    }

    if (classroom.teacherId !== currentUser.sub) {
      throw new ForbiddenException(
        '본인이 만든 수업의 제출 여부만 조회할 수 있습니다.',
      );
    }

    if (classroom.groups.length === 0) {
      return {
        submissions: [],
      };
    }

    const submissions = await this.assignmentSubmissionRepository.find({
      where: {
        groupId: In(classroom.groups.map((group) => group.groupId)),
      },
    });

    const submissionMap = new Map(
      submissions.map((submission) => [submission.groupId, submission]),
    );

    return {
      submissions: classroom.groups.map((group) => {
        const submission = submissionMap.get(group.groupId);

        return {
          groupId: group.groupId,
          groupName: group.name,
          isSubmitted: !!submission,
          submissionId: submission?.submissionId ?? null,
          fileUrl: submission?.fileUrl ?? null,
          link: submission?.link ?? null,
          submittedAt: submission?.submittedAt ?? null,
        };
      }),
    };
  }

  private async getStudentAccessibleGroup(
    currentUser: JwtPayload,
    groupId: string,
  ): Promise<Group> {
    const group = await this.groupRepository.findOne({
      where: {
        groupId,
      },
      relations: {
        groupMembers: {
          classParticipant: true,
        },
      },
    });

    if (!group) {
      throw new NotFoundException('해당 모둠을 찾을 수 없습니다.');
    }

    const isMember = group.groupMembers.some(
      (groupMember) =>
        groupMember.classParticipant.studentId === currentUser.sub,
    );

    if (!isMember) {
      throw new ForbiddenException('본인이 속한 모둠만 제출할 수 있습니다.');
    }

    return group;
  }

  private toSubmissionItem(
    submission: AssignmentSubmission,
  ): AssignmentSubmissionItemDto {
    return {
      submissionId: submission.submissionId,
      groupId: submission.groupId,
      fileUrl: submission.fileUrl,
      link: submission.link,
      submittedBy: submission.submittedBy,
      submittedAt: submission.submittedAt,
      updatedAt: submission.updatedAt,
    };
  }
}
