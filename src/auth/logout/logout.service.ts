import { Injectable } from '@nestjs/common';
import { RefreshTokenService } from '../login/refresh-token/refresh-token.service';
import { TokenService } from '../login/token/token.service';
import { LogoutRequestDto } from './dto/logout.request.dto';

@Injectable()
export class LogoutService {
  constructor(
    private readonly tokenService: TokenService,
    private readonly refreshTokenService: RefreshTokenService,
  ) {}

  async logout(request: LogoutRequestDto): Promise<{ message: string }> {
    const payload = this.tokenService.verifyRefreshToken(request.refreshToken);
    await this.refreshTokenService.validate(payload.sub, request.refreshToken);
    await this.refreshTokenService.remove(payload.sub);

    return {
      message: '로그아웃했습니다.',
    };
  }
}
