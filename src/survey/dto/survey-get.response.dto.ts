import { ApiProperty } from '@nestjs/swagger';
import { SurveyResponseDto } from './survey.response.dto';

export class GetMySurveySuccessResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: 200 })
  statusCode!: number;

  @ApiProperty({
    type: SurveyResponseDto,
    nullable: true,
    example: {
      surveyId: 'survey-1',
      userId: 'student-1',
      mbti: 'INTJ',
      personality: '계획적으로 움직이는 편이고 역할이 분명한 작업을 선호합니다.',
      preference: '문서 작업과 일정 기반 진행을 선호합니다.',
      createdAt: '2026-04-10T12:00:00.000Z',
      updatedAt: '2026-04-10T12:30:00.000Z',
    },
  })
  data!: SurveyResponseDto | null;

  @ApiProperty({ example: '2026-04-11T12:00:00.000Z' })
  timestamp!: string;

  @ApiProperty({ example: '/survey/me' })
  path!: string;
}
