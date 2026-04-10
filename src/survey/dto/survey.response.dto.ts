import { ApiProperty } from '@nestjs/swagger';

export class SurveyResponseDto {
  @ApiProperty({ example: 'survey-1' })
  surveyId!: string;

  @ApiProperty({ example: 'student-1' })
  userId!: string;

  @ApiProperty({ example: 'INTJ', nullable: true })
  mbti!: string | null;

  @ApiProperty({
    example: '계획적으로 움직이는 편이고 역할이 분명한 협업을 선호합니다.',
    nullable: true,
  })
  personality!: string | null;

  @ApiProperty({
    example: '정리된 문서 협업과 일정 기반 진행을 선호합니다.',
    nullable: true,
  })
  preference!: string | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
