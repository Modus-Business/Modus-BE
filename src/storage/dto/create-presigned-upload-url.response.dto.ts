import { ApiProperty } from '@nestjs/swagger';

export class CreatePresignedUploadUrlResponseDto {
  @ApiProperty({
    example: 'assignments/2026/04/10/user-id-1712745600000-team-result.pdf',
  })
  fileKey!: string;

  @ApiProperty({
    example:
      'https://bucket.s3.ap-northeast-2.amazonaws.com/assignments/2026/04/10/user-id-1712745600000-team-result.pdf',
  })
  fileUrl!: string;

  @ApiProperty({
    example:
      'https://bucket.s3.ap-northeast-2.amazonaws.com/assignments/2026/04/10/user-id-1712745600000-team-result.pdf?...',
  })
  uploadUrl!: string;

  @ApiProperty({ example: 300 })
  expiresInSeconds!: number;
}
