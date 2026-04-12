import { ApiProperty } from '@nestjs/swagger';
import {
  AssignmentSubmissionItemDto,
  AssignmentSubmissionStatusDto,
  AssignmentSubmissionStatusListResponseDto,
} from './assignment-submission.response.dto';

export class GetMySubmissionSuccessResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: 200 })
  statusCode!: number;

  @ApiProperty({
    type: AssignmentSubmissionItemDto,
    nullable: true,
    example: {
      submissionId: 'submission-1',
      groupId: 'group-1',
      fileUrl:
        '/assignments/submissions/11111111-1111-1111-1111-111111111111/download',
      link: null,
      submittedBy: 'student-1',
      submittedAt: '2026-04-10T12:00:00.000Z',
      updatedAt: '2026-04-10T12:30:00.000Z',
    },
  })
  data!: AssignmentSubmissionItemDto | null;

  @ApiProperty({ example: '2026-04-11T12:00:00.000Z' })
  timestamp!: string;

  @ApiProperty({ example: '/assignments/submissions/my/group-1' })
  path!: string;
}

export class GetClassSubmissionStatusesSuccessResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: 200 })
  statusCode!: number;

  @ApiProperty({
    type: AssignmentSubmissionStatusListResponseDto,
    example: {
      submissions: [
        {
          groupId: 'group-1',
          groupName: 'Group 3',
          isSubmitted: true,
          submissionId: 'submission-1',
          fileUrl:
            '/assignments/submissions/11111111-1111-1111-1111-111111111111/download',
          link: null,
          submittedAt: '2026-04-10T12:00:00.000Z',
        },
      ],
    },
  })
  data!: AssignmentSubmissionStatusListResponseDto;

  @ApiProperty({ example: '2026-04-11T12:00:00.000Z' })
  timestamp!: string;

  @ApiProperty({ example: '/assignments/submissions/class/class-1' })
  path!: string;
}

export const AssignmentGetExtraModels = [
  AssignmentSubmissionItemDto,
  AssignmentSubmissionStatusDto,
  AssignmentSubmissionStatusListResponseDto,
  GetMySubmissionSuccessResponseDto,
  GetClassSubmissionStatusesSuccessResponseDto,
] as const;
