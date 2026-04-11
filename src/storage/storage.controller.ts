import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { ApiErrorResponses } from '../common/decorators/api-error-responses.decorator';
import { CreatePresignedUploadUrlRequestDto } from './dto/create-presigned-upload-url.request.dto';
import { CreatePresignedUploadUrlResponseDto } from './dto/create-presigned-upload-url.response.dto';
import { StorageService } from './storage.service';

@ApiTags('storage')
@ApiBearerAuth('access-token')
@Controller('storage')
@UseGuards(JwtAuthGuard)
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('presigned-upload-url')
  @ApiOperation({ summary: 'S3 업로드용 presigned URL 발급' })
  @ApiOkResponse({
    description: '클라이언트가 S3에 직접 업로드할 수 있는 presigned URL을 발급합니다.',
    type: CreatePresignedUploadUrlResponseDto,
  })
  @ApiErrorResponses([400, 401, 500])
  async createPresignedUploadUrl(
    @CurrentUser() currentUser: JwtPayload,
    @Body() request: CreatePresignedUploadUrlRequestDto,
  ): Promise<CreatePresignedUploadUrlResponseDto> {
    return this.storageService.createPresignedUploadUrl(currentUser, request);
  }
}
