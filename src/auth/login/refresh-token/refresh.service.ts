import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../signup/entities/user.entity';
import { TokenService } from '../token/token.service';
import { LoginResponseDto } from '../dto/login.response.dto';
import { RefreshRequestDto } from './dto/refresh.request.dto';
import { RefreshTokenService } from './refresh-token.service';

@Injectable()
export class RefreshService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly tokenService: TokenService,
    private readonly refreshTokenService: RefreshTokenService,
  ) {}

  async refresh(request: RefreshRequestDto): Promise<LoginResponseDto> {
    const payload = this.tokenService.verifyRefreshToken(request.refreshToken);
    await this.refreshTokenService.validate(payload.sub, request.refreshToken);

    const user = await this.userRepository.findOne({
      where: {
        userId: payload.sub,
      },
    });

    if (!user) {
      throw new UnauthorizedException('사용자를 찾을 수 없습니다.');
    }

    const accessToken = this.tokenService.createAccessToken(user);
    const refreshToken = this.tokenService.createRefreshToken(user);

    await this.refreshTokenService.save(user.userId, refreshToken);

    return {
      tokenType: 'Bearer',
      accessToken,
      refreshToken,
      email: user.email,
    };
  }
}
