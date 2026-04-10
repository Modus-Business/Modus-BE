import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { hash } from 'bcryptjs';
import { Repository } from 'typeorm';
import { TokenService } from '../token/token.service';
import { RefreshToken } from './entities/refresh-token.entity';
import { RefreshTokenService } from './refresh-token.service';

describe('RefreshTokenService', () => {
  let refreshTokenService: RefreshTokenService;
  let refreshTokenRepository: jest.Mocked<Repository<RefreshToken>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefreshTokenService,
        {
          provide: getRepositoryToken(RefreshToken),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: TokenService,
          useValue: {
            getRefreshTokenExpiresAt: jest.fn(),
          },
        },
      ],
    }).compile();

    refreshTokenService = module.get<RefreshTokenService>(RefreshTokenService);
    refreshTokenRepository = module.get(getRepositoryToken(RefreshToken));
  });

  it('저장된 refresh token이 없으면 UnauthorizedException을 던진다', async () => {
    refreshTokenRepository.findOne.mockResolvedValue(null);

    await expect(
      refreshTokenService.validate('user-1', 'refresh-token'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('만료된 refresh token이면 삭제 후 UnauthorizedException을 던진다', async () => {
    refreshTokenRepository.findOne.mockResolvedValue({
      refreshTokenId: 'token-1',
      userId: 'user-1',
      tokenHash: await hash('refresh-token', 4),
      expiresAt: new Date(Date.now() - 1_000),
      createdAt: new Date(),
      updatedAt: new Date(),
      user: undefined as never,
    });
    refreshTokenRepository.delete.mockResolvedValue({ affected: 1, raw: {} });

    await expect(
      refreshTokenService.validate('user-1', 'refresh-token'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(refreshTokenRepository.delete).toHaveBeenCalledWith({
      userId: 'user-1',
    });
  });

  it('해시가 일치하지 않으면 UnauthorizedException을 던진다', async () => {
    refreshTokenRepository.findOne.mockResolvedValue({
      refreshTokenId: 'token-1',
      userId: 'user-1',
      tokenHash: await hash('other-refresh-token', 4),
      expiresAt: new Date(Date.now() + 10_000),
      createdAt: new Date(),
      updatedAt: new Date(),
      user: undefined as never,
    });

    await expect(
      refreshTokenService.validate('user-1', 'refresh-token'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('해시가 일치하면 refresh token을 유효하다고 판단한다', async () => {
    refreshTokenRepository.findOne.mockResolvedValue({
      refreshTokenId: 'token-1',
      userId: 'user-1',
      tokenHash: await hash('refresh-token', 4),
      expiresAt: new Date(Date.now() + 10_000),
      createdAt: new Date(),
      updatedAt: new Date(),
      user: undefined as never,
    });

    await expect(
      refreshTokenService.validate('user-1', 'refresh-token'),
    ).resolves.toBeUndefined();
  });
});
