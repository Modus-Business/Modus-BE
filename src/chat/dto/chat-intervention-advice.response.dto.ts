import { ApiProperty } from '@nestjs/swagger';

export class ChatInterventionAdviceResponseDto {
  @ApiProperty({ example: '2b7d2450-0035-4fe3-b7d0-6d60317ba25d' })
  groupId!: string;

  @ApiProperty({ example: true })
  interventionNeeded!: boolean;

  @ApiProperty({
    example: 'participation',
    enum: ['none', 'participation', 'deep_question', 'stalled_discussion'],
  })
  interventionType!:
    | 'none'
    | 'participation'
    | 'deep_question'
    | 'stalled_discussion';

  @ApiProperty({
    example: '몇몇 사람만 말해 다른 참여가 필요해요',
  })
  reason!: string;

  @ApiProperty({
    example: '다른 의견도 편하게 말해볼까요',
    nullable: true,
  })
  suggestedMessage!: string | null;
}
