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

  @ApiProperty({
    example:
      '논의 흐름을 정리하며 방향을 잡았습니다. 여러 의견을 연결해 협업이 끊기지 않도록 도왔습니다.',
  })
  reason!: string;
}

export class ChatContributionAnalysisResponseDto {
  @ApiProperty({ example: '2b7d2450-0035-4fe3-b7d0-6d60317ba25d' })
  groupId!: string;

  @ApiProperty({
    example:
      '최근 대화에서는 역할 분담이 비교적 분명했습니다. 정리와 아이디어 제안 역할이 나뉘어 보였습니다.',
  })
  summary!: string;

  @ApiProperty({ type: [ChatContributionMemberDto] })
  members!: ChatContributionMemberDto[];
}
