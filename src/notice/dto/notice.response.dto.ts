import { ApiProperty } from '@nestjs/swagger';

export class NoticeItemDto {
  @ApiProperty({ example: 'notice-1' })
  noticeId!: string;

  @ApiProperty({ example: 'class-1' })
  classId!: string;

  @ApiProperty({ example: '오늘 수업 공지' })
  title!: string;

  @ApiProperty({
    example: '오후 3시까지 초안 제출 후 전체 피드백을 진행합니다.',
  })
  content!: string;

  @ApiProperty()
  createdAt!: Date;
}

export class NoticeListResponseDto {
  @ApiProperty({ type: [NoticeItemDto] })
  notices!: NoticeItemDto[];
}
