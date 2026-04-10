import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { compare, hash } from 'bcryptjs';
import { Repository } from 'typeorm';
import { TokenService } from '../token/token.service';
import { RefreshToken } from './entities/refresh-token.entity';

@Injectable()
export class RefreshTokenService {
  constructor(
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    private readonly tokenService: TokenService,
  ) {}

  async save(userId: string, refreshToken: string): Promise<void> {
    const tokenHash = await hash(refreshToken, 10);
    const expiresAt = this.tokenService.getRefreshTokenExpiresAt(refreshToken);
    const existingRefreshToken = await this.refreshTokenRepository.findOne({
      where: {
        userId,
      },
    });

    if (existingRefreshToken) {
      existingRefreshToken.tokenHash = tokenHash;
      existingRefreshToken.expiresAt = expiresAt;
      await this.refreshTokenRepository.save(existingRefreshToken);
      return;
    }

    const createdRefreshToken = this.refreshTokenRepository.create({
      userId,
      tokenHash,
      expiresAt,
    });

    await this.refreshTokenRepository.save(createdRefreshToken);
  }

  async validate(userId: string, refreshToken: string): Promise<void> {
    const savedRefreshToken = await this.refreshTokenRepository.findOne({
      where: {
        userId,
      },
    });

    if (!savedRefreshToken) {
      throw new UnauthorizedException('유효한 리프레시 토큰이 없습니다.');
    }

    if (savedRefreshToken.expiresAt.getTime() <= Date.now()) {
      await this.refreshTokenRepository.delete({
        userId,
      });
      throw new UnauthorizedException('리프레시 토큰이 만료되었습니다.');
    }

    const isValidRefreshToken = await compare(
      refreshToken,
      savedRefreshToken.tokenHash,
    );

    if (!isValidRefreshToken) {
      throw new UnauthorizedException('리프레시 토큰이 올바르지 않습니다.');
    }
  }

  async remove(userId: string): Promise<void> {
    await this.refreshTokenRepository.delete({
      userId,
    });
  }
}
