import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiErrorResponses } from '../../common/decorators/api-error-responses.decorator';
import { LoginRequestDto } from './dto/login.request.dto';
import { LoginResponseDto } from './dto/login.response.dto';
import { RefreshRequestDto } from './refresh-token/dto/refresh.request.dto';
import { RefreshService } from './refresh-token/refresh.service';
import { LoginService } from './login.service';

@ApiTags('auth')
@Controller('auth/login')
export class LoginController {
  constructor(
    private readonly loginService: LoginService,
    private readonly refreshService: RefreshService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '로그인' })
  @ApiOkResponse({
    description: '이메일과 비밀번호로 로그인하고 액세스 토큰과 리프레시 토큰을 발급합니다.',
    type: LoginResponseDto,
  })
  @ApiErrorResponses([400, 401, 500])
  async login(@Body() request: LoginRequestDto): Promise<LoginResponseDto> {
    return this.loginService.login(request);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '토큰 재발급' })
  @ApiOkResponse({
    description: '리프레시 토큰으로 새로운 액세스 토큰과 리프레시 토큰을 발급합니다.',
    type: LoginResponseDto,
  })
  @ApiErrorResponses([400, 401, 500])
  async refresh(@Body() request: RefreshRequestDto): Promise<LoginResponseDto> {
    return this.refreshService.refresh(request);
  }
}
