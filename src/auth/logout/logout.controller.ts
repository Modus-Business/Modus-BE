import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiErrorResponses } from '../../common/decorators/api-error-responses.decorator';
import { LogoutRequestDto } from './dto/logout.request.dto';
import { LogoutResponseDto } from './dto/logout.response.dto';
import { LogoutService } from './logout.service';

@ApiTags('auth')
@Controller('auth/logout')
export class LogoutController {
  constructor(private readonly logoutService: LogoutService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '로그아웃' })
  @ApiOkResponse({
    description: '리프레시 토큰을 폐기하고 로그아웃 처리합니다.',
    type: LogoutResponseDto,
  })
  @ApiErrorResponses([400, 401, 500])
  async logout(@Body() request: LogoutRequestDto): Promise<LogoutResponseDto> {
    return this.logoutService.logout(request);
  }
}
