import { ApiProperty } from '@nestjs/swagger';

export class AssignmentSubmissionItemDto {
  @ApiProperty({ example: 'submission-1' })
  submissionId!: string;

  @ApiProperty({ example: 'group-1' })
  groupId!: string;

  @ApiProperty({
    example: '/assignments/submissions/11111111-1111-1111-1111-111111111111/download',
    nullable: true,
    description: '제출 파일 다운로드용 백엔드 endpoint입니다.',
  })
  fileUrl!: string | null;

  @ApiProperty({
    example: 'https://figma.com/file/example',
    nullable: true,
  })
  link!: string | null;

  @ApiProperty({ example: 'student-1' })
  submittedBy!: string;

  @ApiProperty()
  submittedAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class AssignmentSubmissionStatusDto {
  @ApiProperty({ example: 'group-1' })
  groupId!: string;

  @ApiProperty({ example: '모둠 3' })
  groupName!: string;

  @ApiProperty({ example: true })
  isSubmitted!: boolean;

  @ApiProperty({
    example: 'submission-1',
    nullable: true,
  })
  submissionId!: string | null;

  @ApiProperty({
    example: '/assignments/submissions/11111111-1111-1111-1111-111111111111/download',
    nullable: true,
    description: '제출 파일 다운로드용 백엔드 endpoint입니다.',
  })
  fileUrl!: string | null;

  @ApiProperty({
    example: 'https://figma.com/file/example',
    nullable: true,
  })
  link!: string | null;

  @ApiProperty({ nullable: true })
  submittedAt!: Date | null;
}

export class AssignmentSubmissionStatusListResponseDto {
  @ApiProperty({ type: [AssignmentSubmissionStatusDto] })
  submissions!: AssignmentSubmissionStatusDto[];
}
