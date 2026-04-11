import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { UserRole } from '../auth/signup/enums/user-role.enum';
import { Classroom } from '../class/entities/class.entity';
import { Group } from '../group/entities/group.entity';
import {
  AssignmentSubmissionItemDto,
  AssignmentSubmissionStatusListResponseDto,
} from './dto/assignment-submission.response.dto';
import { SubmitAssignmentRequestDto } from './dto/submit-assignment.request.dto';
import { AssignmentSubmission } from './entities/assignment-submission.entity';

@Injectable()
export class AssignmentService {
  constructor(
    @InjectRepository(AssignmentSubmission)
    private readonly assignmentSubmissionRepository: Repository<AssignmentSubmission>,
    @InjectRepository(Group)
    private readonly groupRepository: Repository<Group>,
    @InjectRepository(Classroom)
    private readonly classroomRepository: Repository<Classroom>,
    private readonly configService: ConfigService,
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

    if (request.fileUrl) {
      this.validateAssignmentFileUrl(request.fileUrl);
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
        '교사만 수업별 제출 현황을 조회할 수 있습니다.',
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
        '본인이 만든 수업의 제출 현황만 조회할 수 있습니다.',
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

  private validateAssignmentFileUrl(fileUrl: string): void {
    const allowedPrefixes = this.getAllowedAssignmentFileUrlPrefixes();
    const normalizedFileUrl = fileUrl.trim();

    if (
      allowedPrefixes.length > 0 &&
      !allowedPrefixes.some((prefix) => normalizedFileUrl.startsWith(prefix))
    ) {
      throw new BadRequestException(
        'fileUrl은 스토리지 업로드 API가 발급한 assignments 경로만 사용할 수 있습니다.',
      );
    }

    const pathname = this.extractPathname(normalizedFileUrl);

    if (!pathname.startsWith('/assignments/')) {
      throw new BadRequestException(
        'fileUrl은 assignments 경로의 업로드 파일이어야 합니다.',
      );
    }
  }

  private getAllowedAssignmentFileUrlPrefixes(): string[] {
    const publicBaseUrl =
      this.configService.get<string>('AWS_S3_PUBLIC_BASE_URL')?.trim() ?? '';
    const bucket = this.configService.get<string>('AWS_S3_BUCKET')?.trim() ?? '';
    const region = this.configService.get<string>('AWS_REGION')?.trim() ?? '';
    const prefixes = new Set<string>();

    if (publicBaseUrl) {
      prefixes.add(publicBaseUrl.replace(/\/$/, '') + '/');
    }

    if (bucket && region) {
      prefixes.add(`https://${bucket}.s3.${region}.amazonaws.com/`);
    }

    return Array.from(prefixes);
  }

  private extractPathname(fileUrl: string): string {
    try {
      return new URL(fileUrl).pathname;
    } catch {
      throw new BadRequestException('fileUrl 형식이 올바르지 않습니다.');
    }
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
