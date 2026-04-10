import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { compare } from 'bcryptjs';
import { Repository } from 'typeorm';
import { RefreshTokenService } from './refresh-token/refresh-token.service';
import { TokenService } from './token/token.service';
import { User } from '../signup/entities/user.entity';
import { LoginRequestDto } from './dto/login.request.dto';
import { LoginResponseDto } from './dto/login.response.dto';

@Injectable()
export class LoginService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly tokenService: TokenService,
    private readonly refreshTokenService: RefreshTokenService,
  ) {}

  async login(request: LoginRequestDto): Promise<LoginResponseDto> {
    const normalizedEmail = request.email.trim().toLowerCase();
    const user = await this.userRepository.findOne({
      where: {
        email: normalizedEmail,
      },
    });

    if (!user) {
      throw new UnauthorizedException(
        '이메일 또는 비밀번호가 올바르지 않습니다.',
      );
    }

    const isPasswordValid = await compare(request.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException(
        '이메일 또는 비밀번호가 올바르지 않습니다.',
      );
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
