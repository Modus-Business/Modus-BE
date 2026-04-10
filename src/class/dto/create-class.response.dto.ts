import { ApiProperty } from '@nestjs/swagger';

export class CreateClassResponseDto {
  @ApiProperty({ example: '0a11d54c-c75a-4d10-a4a0-1fd224c636c7' })
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

  @ApiProperty({ example: 0 })
  studentCount!: number;

  @ApiProperty({ example: '2026-04-10T12:00:00.000Z' })
  createdAt!: Date;
}
