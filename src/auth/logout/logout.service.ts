import { Injectable } from '@nestjs/common';
import { RefreshTokenService } from '../login/refresh-token/refresh-token.service';
import { TokenService } from '../login/token/token.service';
import { LogoutRequestDto } from './dto/logout.request.dto';
import { LogoutResponseDto } from './dto/logout.response.dto';

@Injectable()
export class LogoutService {
  constructor(
    private readonly tokenService: TokenService,
    private readonly refreshTokenService: RefreshTokenService,
  ) {}

  async logout(request: LogoutRequestDto): Promise<LogoutResponseDto> {
    const payload = this.tokenService.verifyRefreshToken(request.refreshToken);
    await this.refreshTokenService.validate(payload.sub, request.refreshToken);
    await this.refreshTokenService.remove(payload.sub);

    return {
      message: '로그아웃되었습니다.',
    };
  }
}
