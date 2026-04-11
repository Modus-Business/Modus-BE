import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiExtraModels,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { GetMeSettingsSuccessResponseDto } from './dto/me-get.response.dto';
import { MeSettingsResponseDto } from './dto/me-settings.response.dto';
import { MeService } from './me.service';

@ApiTags('me')
@ApiExtraModels(MeSettingsResponseDto, GetMeSettingsSuccessResponseDto)
@ApiBearerAuth('access-token')
@Controller('me')
@UseGuards(JwtAuthGuard)
export class MeController {
  constructor(private readonly meService: MeService) {}

  @Get('settings')
  @ApiOperation({ summary: '설정 화면 사용자 정보 조회' })
  @ApiOkResponse({
    description: '설정 화면에 필요한 사용자 정보를 반환합니다.',
    type: GetMeSettingsSuccessResponseDto,
  })
  async getSettings(
    @CurrentUser() currentUser: JwtPayload,
  ): Promise<MeSettingsResponseDto> {
    return this.meService.getSettings(currentUser);
  }
}
