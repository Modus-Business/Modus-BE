import { ApiProperty } from '@nestjs/swagger';

export class GroupNicknameResponseDto {
  @ApiProperty({ example: 'group-1' })
  groupId!: string;

  @ApiProperty({ example: '차분한 설계자' })
  nickname!: string;

  @ApiProperty({
    example: '차분하게 정리하고 구조를 잡는 성향을 반영한 닉네임이에요.',
  })
  reason!: string;
}

export class GetGroupNicknameSuccessResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: 200 })
  statusCode!: number;

  @ApiProperty({
    type: GroupNicknameResponseDto,
    example: {
      groupId: 'group-1',
      nickname: '차분한 설계자',
      reason: '차분하게 정리하고 구조를 잡는 성향을 반영한 닉네임이에요.',
    },
  })
  data!: GroupNicknameResponseDto;

  @ApiProperty({ example: '2026-04-13T12:00:00.000Z' })
  timestamp!: string;

  @ApiProperty({ example: '/groups/group-1/nickname' })
  path!: string;
}
