import { ApiProperty } from '@nestjs/swagger';

export class ChatContributionMemberDto {
  @ApiProperty({ example: '차분한 설계자' })
  nickname!: string;

  @ApiProperty({ example: 78, minimum: 0, maximum: 100 })
  contributionScore!: number;

  @ApiProperty({ example: 'high', enum: ['high', 'medium', 'low'] })
  contributionLevel!: 'high' | 'medium' | 'low';

  @ApiProperty({
    example: ['summarizer', 'facilitator'],
    enum: [
      'initiator',
      'idea_provider',
      'questioner',
      'summarizer',
      'facilitator',
      'executor',
    ],
    isArray: true,
  })
  contributionTypes!: Array<
    | 'initiator'
    | 'idea_provider'
    | 'questioner'
    | 'summarizer'
    | 'facilitator'
    | 'executor'
  >;

  @ApiProperty({ example: '논의 흐름을 정리하고 다음 순서를 제안했어요' })
  reason!: string;
}

export class ChatContributionAnalysisResponseDto {
  @ApiProperty({ example: '2b7d2450-0035-4fe3-b7d0-6d60317ba25d' })
  groupId!: string;

  @ApiProperty({ example: '역할 분담과 정리 기여가 잘 드러났어요' })
  summary!: string;

  @ApiProperty({ type: [ChatContributionMemberDto] })
  members!: ChatContributionMemberDto[];
}
