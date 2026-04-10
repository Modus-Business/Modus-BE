import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { MeSettingsResponseDto } from './dto/me-settings.response.dto';
import { MeService } from './me.service';

@ApiTags('me')
@Controller('me')
@UseGuards(JwtAuthGuard)
export class MeController {
  constructor(private readonly meService: MeService) {}

  @Get('settings')
  @ApiOperation({ summary: '설정 화면용 내 정보 조회' })
  async getSettings(
    @CurrentUser() currentUser: JwtPayload,
  ): Promise<MeSettingsResponseDto> {
    return this.meService.getSettings(currentUser);
  }
}
