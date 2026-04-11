import { ApiProperty } from '@nestjs/swagger';
import {
  GroupDetailResponseDto,
  GroupDetailMemberDto,
} from './group-detail.response.dto';
import {
  GroupListResponseDto,
  GroupSummaryDto,
} from './group-list.response.dto';
import {
  MyGroupResponseDto,
  MyGroupSummaryDto,
} from './my-group.response.dto';

export class GetGroupsByClassSuccessResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: 200 })
  statusCode!: number;

  @ApiProperty({
    type: GroupListResponseDto,
    example: {
      groups: [
        {
          groupId: 'group-1',
          classId: 'class-1',
          name: 'Group 3',
          memberCount: 4,
          createdAt: '2026-04-10T12:00:00.000Z',
        },
      ],
    },
  })
  data!: GroupListResponseDto;

  @ApiProperty({ example: '2026-04-11T12:00:00.000Z' })
  timestamp!: string;

  @ApiProperty({ example: '/groups/class/class-1' })
  path!: string;
}

export class GetMyGroupSuccessResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: 200 })
  statusCode!: number;

  @ApiProperty({
    type: MyGroupResponseDto,
    example: {
      hasGroup: true,
      group: {
        groupId: 'group-1',
        classId: 'class-1',
        name: 'Group 3',
        memberCount: 4,
      },
      message: null,
    },
  })
  data!: MyGroupResponseDto;

  @ApiProperty({ example: '2026-04-11T12:00:00.000Z' })
  timestamp!: string;

  @ApiProperty({ example: '/groups/my/class-1' })
  path!: string;
}

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
  GroupSummaryDto,
  GroupListResponseDto,
  MyGroupSummaryDto,
  MyGroupResponseDto,
  GroupDetailMemberDto,
  GroupDetailResponseDto,
  GetGroupsByClassSuccessResponseDto,
  GetMyGroupSuccessResponseDto,
  GetGroupDetailSuccessResponseDto,
] as const;
