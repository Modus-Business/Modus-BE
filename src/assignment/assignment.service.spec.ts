import {
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRole } from '../auth/signup/enums/user-role.enum';
import { Classroom } from '../class/entities/class.entity';
import { Group } from '../group/entities/group.entity';
import { AssignmentService } from './assignment.service';
import { AssignmentSubmission } from './entities/assignment-submission.entity';

describe('AssignmentService', () => {
  let assignmentService: AssignmentService;
  let assignmentSubmissionRepository: jest.Mocked<
    Repository<AssignmentSubmission>
  >;
  let groupRepository: jest.Mocked<Repository<Group>>;
  let classroomRepository: jest.Mocked<Repository<Classroom>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssignmentService,
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
      ],
    }).compile();

    assignmentService = module.get<AssignmentService>(AssignmentService);
    assignmentSubmissionRepository = module.get(
      getRepositoryToken(AssignmentSubmission),
    );
    groupRepository = module.get(getRepositoryToken(Group));
    classroomRepository = module.get(getRepositoryToken(Classroom));
  });

  it('수강생은 자기 모둠 결과물을 제출할 수 있다', async () => {
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
      fileUrl: 'https://storage.example.com/files/result.pdf',
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
        fileUrl: 'https://storage.example.com/files/result.pdf',
      },
    );

    expect(result.groupId).toBe('group-1');
  });

  it('fileUrl과 link가 모두 없으면 BadRequestException을 던진다', async () => {
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

  it('교강사는 수업 모둠별 제출 여부를 조회할 수 있다', async () => {
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
        fileUrl: 'https://storage.example.com/files/result.pdf',
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
  });

  it('수강생이 자기 모둠이 아니면 제출할 수 없다', async () => {
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
});
