import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { LogoutRequestDto } from './dto/logout.request.dto';
import { LogoutService } from './logout.service';

@ApiTags('auth')
@Controller('auth/logout')
export class LogoutController {
  constructor(private readonly logoutService: LogoutService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '로그아웃' })
  async logout(@Body() request: LogoutRequestDto): Promise<{ message: string }> {
    return this.logoutService.logout(request);
  }
}
