import { ApiProperty } from '@nestjs/swagger';

export class JoinClassResponseDto {
  @ApiProperty({ example: 'class-1' })
  classId!: string;

  @ApiProperty({ example: '프로덕트 스튜디오' })
  name!: string;

  @ApiProperty({
    example: '서비스 구조 설계와 퍼블리싱을 함께 진행하는 메인 실습 수업',
    nullable: true,
  })
  description!: string | null;

  @ApiProperty({ example: 'AB12-CD34' })
  classCode!: string;

  @ApiProperty()
  joinedAt!: Date;
}
