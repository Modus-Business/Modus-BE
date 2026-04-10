import { ApiProperty } from '@nestjs/swagger';

export class AssignmentSubmissionItemDto {
  @ApiProperty({ example: 'submission-1' })
  submissionId!: string;

  @ApiProperty({ example: 'group-1' })
  groupId!: string;

  @ApiProperty({
    example: 'https://storage.example.com/files/result.pdf',
    nullable: true,
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
    example: 'https://storage.example.com/files/result.pdf',
    nullable: true,
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
