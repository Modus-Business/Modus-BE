import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class ChatContributionAnalysisRequestDto {
  @ApiProperty({ example: '2b7d2450-0035-4fe3-b7d0-6d60317ba25d' })
  @IsUUID()
  groupId!: string;
}
