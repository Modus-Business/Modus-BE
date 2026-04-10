import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
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
  async createPresignedUploadUrl(
    @CurrentUser() currentUser: JwtPayload,
    @Body() request: CreatePresignedUploadUrlRequestDto,
  ): Promise<CreatePresignedUploadUrlResponseDto> {
    return this.storageService.createPresignedUploadUrl(currentUser, request);
  }
}
