import { ApiProperty } from '@nestjs/swagger';

export class ChatMessageAdviceResponseDto {
  @ApiProperty({ example: '2b7d2450-0035-4fe3-b7d0-6d60317ba25d' })
  groupId!: string;

  @ApiProperty({ example: 'medium', enum: ['low', 'medium', 'high'] })
  riskLevel!: 'low' | 'medium' | 'high';

  @ApiProperty({ example: false })
  shouldBlock!: boolean;

  @ApiProperty({
    example: '이 표현은 조금 강하게 들릴 수 있어요',
  })
  warning!: string;

  @ApiProperty({
    example: '다음엔 같이 더 깔끔히 맞춰보면 좋아요',
    nullable: true,
  })
  suggestedRewrite!: string | null;
}
