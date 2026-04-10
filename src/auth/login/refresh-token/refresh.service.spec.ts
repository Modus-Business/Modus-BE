import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRole } from '../../signup/enums/user-role.enum';
import { User } from '../../signup/entities/user.entity';
import { TokenService } from '../token/token.service';
import { RefreshService } from './refresh.service';
import { RefreshTokenService } from './refresh-token.service';

describe('RefreshService', () => {
  let refreshService: RefreshService;
  let userRepository: jest.Mocked<Repository<User>>;
  let tokenService: {
    verifyRefreshToken: jest.Mock<
      { sub: string; email: string; role: UserRole },
      [string]
    >;
    createAccessToken: jest.Mock<string, [User]>;
    createRefreshToken: jest.Mock<string, [User]>;
  };
  let refreshTokenService: {
    validate: jest.Mock<Promise<void>, [string, string]>;
    save: jest.Mock<Promise<void>, [string, string]>;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefreshService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: TokenService,
          useValue: {
            verifyRefreshToken: jest.fn(),
            createAccessToken: jest.fn(),
            createRefreshToken: jest.fn(),
          },
        },
        {
          provide: RefreshTokenService,
          useValue: {
            validate: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    refreshService = module.get<RefreshService>(RefreshService);
    userRepository = module.get(getRepositoryToken(User));
    tokenService = module.get(TokenService);
    refreshTokenService = module.get(RefreshTokenService);
  });

  it('refresh token을 검증하고 새 토큰으로 회전한다', async () => {
    const user = createUser();

    tokenService.verifyRefreshToken.mockReturnValue({
      sub: 'user-1',
      email: 'user@example.com',
      role: UserRole.STUDENT,
    });
    refreshTokenService.validate.mockResolvedValue();
    userRepository.findOne.mockResolvedValue(user);
    tokenService.createAccessToken.mockReturnValue('new-access-token');
    tokenService.createRefreshToken.mockReturnValue('new-refresh-token');
    refreshTokenService.save.mockResolvedValue();

    const result = await refreshService.refresh({
      refreshToken: 'valid-refresh-token',
    });

    expect(refreshTokenService.validate).toHaveBeenCalledWith(
      'user-1',
      'valid-refresh-token',
    );
    expect(refreshTokenService.save).toHaveBeenCalledWith(
      'user-1',
      'new-refresh-token',
    );
    expect(result).toEqual({
      tokenType: 'Bearer',
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
      email: 'user@example.com',
    });
  });

  it('사용자가 없으면 UnauthorizedException을 던진다', async () => {
    tokenService.verifyRefreshToken.mockReturnValue({
      sub: 'user-1',
      email: 'user@example.com',
      role: UserRole.STUDENT,
    });
    refreshTokenService.validate.mockResolvedValue();
    userRepository.findOne.mockResolvedValue(null);

    await expect(
      refreshService.refresh({
        refreshToken: 'valid-refresh-token',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});

function createUser(): User {
  return {
    userId: 'user-1',
    name: '홍길동',
    email: 'user@example.com',
    passwordHash: 'hashed-password',
    isEmailVerified: false,
    role: UserRole.STUDENT,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}
