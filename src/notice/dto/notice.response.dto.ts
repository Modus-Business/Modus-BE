import { ApiProperty } from '@nestjs/swagger';

export class NoticeItemDto {
  @ApiProperty({ example: 'notice-1' })
  noticeId!: string;

  @ApiProperty({ example: 'group-1' })
  groupId!: string;

  @ApiProperty({ example: '오늘 수업 공지' })
  title!: string;

  @ApiProperty({
    example: '오후 3시까지 초안 제출 후 모둠별 피드백을 진행합니다.',
  })
  content!: string;

  @ApiProperty()
  createdAt!: Date;
}

export class NoticeListResponseDto {
  @ApiProperty({ type: [NoticeItemDto] })
  notices!: NoticeItemDto[];
}

export class NoticeLatestResponseDto {
  @ApiProperty({ type: NoticeItemDto, nullable: true })
  notice!: NoticeItemDto | null;
}
