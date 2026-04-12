import { ApiProperty } from '@nestjs/swagger';
import {
  GroupDetailResponseDto,
  GroupDetailMemberDto,
} from './group-detail.response.dto';
import {
  GetGroupNicknameSuccessResponseDto,
  GroupNicknameResponseDto,
} from './group-nickname.response.dto';

export class GetGroupDetailSuccessResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: 200 })
  statusCode!: number;

  @ApiProperty({
    type: GroupDetailResponseDto,
    example: {
      groupId: 'group-1',
      classId: 'class-1',
      name: 'Group 3',
      memberCount: 4,
      members: [
        {
          groupMemberId: 'group-member-1',
          displayName: 'Anonymous Fox',
          isMe: true,
        },
      ],
    },
  })
  data!: GroupDetailResponseDto;

  @ApiProperty({ example: '2026-04-11T12:00:00.000Z' })
  timestamp!: string;

  @ApiProperty({ example: '/groups/group-1' })
  path!: string;
}

export const GroupGetExtraModels = [
  GroupDetailMemberDto,
  GroupDetailResponseDto,
  GroupNicknameResponseDto,
  GetGroupDetailSuccessResponseDto,
  GetGroupNicknameSuccessResponseDto,
] as const;
