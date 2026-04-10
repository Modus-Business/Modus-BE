import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';
import { JwtPayload } from '../../interfaces/jwt-payload.interface';
import { User } from '../../signup/entities/user.entity';

interface JwtPayloadWithExp extends JwtPayload {
  exp: number;
}

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  createAccessToken(user: User): string {
    const payload = this.createPayload(user);

    return this.jwtService.sign(payload, {
      secret: this.getRequiredConfig('JWT_SECRET'),
      expiresIn: this.configService.get<string>(
        'JWT_ACCESS_TOKEN_EXPIRES_IN',
        '15m',
      ) as never,
    });
  }

  createRefreshToken(user: User): string {
    const payload: JwtPayload = {
      ...this.createPayload(user),
      jti: randomUUID(),
    };

    return this.jwtService.sign(payload, {
      secret: this.getRequiredConfig('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>(
        'JWT_REFRESH_TOKEN_EXPIRES_IN',
        '14d',
      ) as never,
    });
  }

  verifyRefreshToken(refreshToken: string): JwtPayload {
    try {
      return this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: this.getRequiredConfig('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException(
        '리프레시 토큰이 올바르지 않거나 만료되었습니다.',
      );
    }
  }

  getRefreshTokenExpiresAt(refreshToken: string): Date {
    const decodedToken = this.jwtService.decode(refreshToken);

    if (
      !decodedToken ||
      typeof decodedToken !== 'object' ||
      !('exp' in decodedToken) ||
      typeof decodedToken.exp !== 'number'
    ) {
      throw new InternalServerErrorException(
        '리프레시 토큰 만료 시간을 확인할 수 없습니다.',
      );
    }

    return new Date((decodedToken as JwtPayloadWithExp).exp * 1000);
  }

  private createPayload(user: User): JwtPayload {
    return {
      sub: user.userId,
      email: user.email,
      role: user.role,
    };
  }

  private getRequiredConfig(key: 'JWT_SECRET' | 'JWT_REFRESH_SECRET'): string {
    const value = this.configService.get<string>(key);

    if (!value) {
      throw new InternalServerErrorException(
        `${key} 환경변수가 설정되지 않았습니다.`,
      );
    }

    return value;
  }
}
