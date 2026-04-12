import {
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRole } from '../auth/signup/enums/user-role.enum';
import { Classroom } from '../class/entities/class.entity';
import { Group } from '../group/entities/group.entity';
import { StorageService } from '../storage/storage.service';
import { AssignmentService } from './assignment.service';
import { AssignmentSubmission } from './entities/assignment-submission.entity';

describe('AssignmentService', () => {
  let assignmentService: AssignmentService;
  let assignmentSubmissionRepository: jest.Mocked<
    Repository<AssignmentSubmission>
  >;
  let groupRepository: jest.Mocked<Repository<Group>>;
  let classroomRepository: jest.Mocked<Repository<Classroom>>;
  let storageService: jest.Mocked<StorageService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssignmentService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'AWS_REGION') {
                return 'ap-northeast-2';
              }

              if (key === 'AWS_S3_BUCKET') {
                return 'modus-files-bucket';
              }

              if (key === 'AWS_S3_PUBLIC_BASE_URL') {
                return '';
              }

              return undefined;
            }),
          },
        },
        {
          provide: getRepositoryToken(AssignmentSubmission),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Group),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Classroom),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: StorageService,
          useValue: {
            createPresignedDownloadUrl: jest.fn(),
          },
        },
      ],
    }).compile();

    assignmentService = module.get<AssignmentService>(AssignmentService);
    assignmentSubmissionRepository = module.get(
      getRepositoryToken(AssignmentSubmission),
    );
    groupRepository = module.get(getRepositoryToken(Group));
    classroomRepository = module.get(getRepositoryToken(Classroom));
    storageService = module.get(StorageService);
  });

  it('학생이 자기 모둠 결과물을 제출할 수 있다', async () => {
    groupRepository.findOne.mockResolvedValue({
      groupId: 'group-1',
      groupMembers: [
        {
          classParticipant: {
            studentId: 'student-1',
          },
        },
      ],
    } as unknown as Group);
    assignmentSubmissionRepository.findOne.mockResolvedValue(null);
    assignmentSubmissionRepository.create.mockImplementation(
      (input) => input as AssignmentSubmission,
    );
    assignmentSubmissionRepository.save.mockResolvedValue({
      submissionId: 'submission-1',
      groupId: 'group-1',
      fileUrl:
        'https://modus-files-bucket.s3.ap-northeast-2.amazonaws.com/assignments/2026/04/11/student-1-result.pdf',
      link: null,
      submittedBy: 'student-1',
      submittedAt: new Date('2026-04-10T12:00:00.000Z'),
      updatedAt: new Date('2026-04-10T12:00:00.000Z'),
      group: undefined as never,
      submitter: undefined as never,
    } as AssignmentSubmission);

    const result = await assignmentService.submitAssignment(
      {
        sub: 'student-1',
        email: 'student@example.com',
        role: UserRole.STUDENT,
      },
      {
        groupId: '11111111-1111-1111-1111-111111111111',
        fileUrl:
          'https://modus-files-bucket.s3.ap-northeast-2.amazonaws.com/assignments/2026/04/11/student-1-result.pdf',
      },
    );

    expect(result.groupId).toBe('group-1');
    expect(result.fileUrl).toBe(
      '/assignments/submissions/submission-1/download',
    );
  });

  it('fileUrl과 link가 모두 없으면 BadRequestException이 발생한다', async () => {
    await expect(
      assignmentService.submitAssignment(
        {
          sub: 'student-1',
          email: 'student@example.com',
          role: UserRole.STUDENT,
        },
        {
          groupId: '11111111-1111-1111-1111-111111111111',
        },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('스토리지 업로드 API가 아닌 임의의 fileUrl은 제출할 수 없다', async () => {
    await expect(
      assignmentService.submitAssignment(
        {
          sub: 'student-1',
          email: 'student@example.com',
          role: UserRole.STUDENT,
        },
        {
          groupId: '11111111-1111-1111-1111-111111111111',
          fileUrl: 'https://evil.example.com/random-file.pdf',
        },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('assignments 경로가 아닌 fileUrl은 제출할 수 없다', async () => {
    await expect(
      assignmentService.submitAssignment(
        {
          sub: 'student-1',
          email: 'student@example.com',
          role: UserRole.STUDENT,
        },
        {
          groupId: '11111111-1111-1111-1111-111111111111',
          fileUrl:
            'https://modus-files-bucket.s3.ap-northeast-2.amazonaws.com/images/2026/04/11/student-1-avatar.png',
        },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('교사는 수업 모둠별 제출 여부를 조회할 수 있다', async () => {
    classroomRepository.findOne.mockResolvedValue({
      classId: 'class-1',
      teacherId: 'teacher-1',
      groups: [
        {
          groupId: 'group-1',
          name: '모둠 3',
        },
      ],
    } as unknown as Classroom);
    assignmentSubmissionRepository.find.mockResolvedValue([
      {
        submissionId: 'submission-1',
        groupId: 'group-1',
        fileUrl:
          'https://modus-files-bucket.s3.ap-northeast-2.amazonaws.com/assignments/2026/04/11/student-1-result.pdf',
        link: null,
        submittedAt: new Date('2026-04-10T12:00:00.000Z'),
      } as AssignmentSubmission,
    ]);

    const result = await assignmentService.getClassSubmissionStatuses(
      {
        sub: 'teacher-1',
        email: 'teacher@example.com',
        role: UserRole.TEACHER,
      },
      '11111111-1111-1111-1111-111111111111',
    );

    expect(result.submissions).toHaveLength(1);
    expect(result.submissions[0].isSubmitted).toBe(true);
    expect(result.submissions[0].fileUrl).toBe(
      '/assignments/submissions/submission-1/download',
    );
  });

  it('학생이 자기 모둠이 아니면 제출할 수 없다', async () => {
    groupRepository.findOne.mockResolvedValue({
      groupId: 'group-1',
      groupMembers: [],
    } as unknown as Group);

    await expect(
      assignmentService.submitAssignment(
        {
          sub: 'student-1',
          email: 'student@example.com',
          role: UserRole.STUDENT,
        },
        {
          groupId: '11111111-1111-1111-1111-111111111111',
          link: 'https://figma.com/file/example',
        },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('제출 다운로드 요청 시 presigned download URL을 발급한다', async () => {
    assignmentSubmissionRepository.findOne.mockResolvedValue({
      submissionId: '11111111-1111-1111-1111-111111111111',
      groupId: 'group-1',
      fileUrl:
        'https://modus-files-bucket.s3.ap-northeast-2.amazonaws.com/assignments/2026/04/11/student-1-result.pdf',
    } as AssignmentSubmission);
    groupRepository.findOne.mockResolvedValue({
      groupId: 'group-1',
      groupMembers: [
        {
          classParticipant: {
            studentId: 'student-1',
          },
        },
      ],
    } as unknown as Group);
    storageService.createPresignedDownloadUrl.mockResolvedValue(
      'https://signed.example.com/download',
    );

    const result = await assignmentService.getSubmissionDownloadUrl(
      {
        sub: 'student-1',
        email: 'student@example.com',
        role: UserRole.STUDENT,
      },
      '11111111-1111-1111-1111-111111111111',
    );

    expect(result).toBe('https://signed.example.com/download');
    expect(storageService.createPresignedDownloadUrl).toHaveBeenCalledWith(
      'https://modus-files-bucket.s3.ap-northeast-2.amazonaws.com/assignments/2026/04/11/student-1-result.pdf',
    );
  });
});
