import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
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
  async login(@Body() request: LoginRequestDto): Promise<LoginResponseDto> {
    return this.loginService.login(request);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '토큰 재발급' })
  async refresh(@Body() request: RefreshRequestDto): Promise<LoginResponseDto> {
    return this.refreshService.refresh(request);
  }
}
