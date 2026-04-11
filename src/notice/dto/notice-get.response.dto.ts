import { ApiProperty } from '@nestjs/swagger';
import { NoticeItemDto, NoticeListResponseDto } from './notice.response.dto';

export class GetNoticesByGroupSuccessResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: 200 })
  statusCode!: number;

  @ApiProperty({
    type: NoticeListResponseDto,
    example: {
      notices: [
        {
          noticeId: 'notice-1',
          groupId: 'group-1',
          title: '수업 공지',
          content: '초안 제출 후 모둠별 피드백을 진행합니다.',
          createdAt: '2026-04-10T12:00:00.000Z',
        },
      ],
    },
  })
  data!: NoticeListResponseDto;

  @ApiProperty({ example: '2026-04-11T12:00:00.000Z' })
  timestamp!: string;

  @ApiProperty({ example: '/notices/group/group-1' })
  path!: string;
}

export const NoticeGetExtraModels = [
  NoticeItemDto,
  NoticeListResponseDto,
  GetNoticesByGroupSuccessResponseDto,
] as const;
