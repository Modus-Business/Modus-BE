import { Test, TestingModule } from '@nestjs/testing';
import { UserRole } from '../signup/enums/user-role.enum';
import { RefreshTokenService } from '../login/refresh-token/refresh-token.service';
import { TokenService } from '../login/token/token.service';
import { LogoutService } from './logout.service';

describe('LogoutService', () => {
  let logoutService: LogoutService;
  let tokenService: {
    verifyRefreshToken: jest.Mock<
      { sub: string; email: string; role: UserRole },
      [string]
    >;
  };
  let refreshTokenService: {
    validate: jest.Mock<Promise<void>, [string, string]>;
    remove: jest.Mock<Promise<void>, [string]>;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LogoutService,
        {
          provide: TokenService,
          useValue: {
            verifyRefreshToken: jest.fn(),
          },
        },
        {
          provide: RefreshTokenService,
          useValue: {
            validate: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    logoutService = module.get<LogoutService>(LogoutService);
    tokenService = module.get(TokenService);
    refreshTokenService = module.get(RefreshTokenService);
  });

  it('logout 시 refresh token을 검증하고 저장된 토큰을 제거한다', async () => {
    tokenService.verifyRefreshToken.mockReturnValue({
      sub: 'user-1',
      email: 'user@example.com',
      role: UserRole.STUDENT,
    });
    refreshTokenService.validate.mockResolvedValue();
    refreshTokenService.remove.mockResolvedValue();

    const result = await logoutService.logout({
      refreshToken: 'valid-refresh-token',
    });

    expect(refreshTokenService.validate).toHaveBeenCalledWith(
      'user-1',
      'valid-refresh-token',
    );
    expect(refreshTokenService.remove).toHaveBeenCalledWith('user-1');
    expect(result).toEqual({
      message: '로그아웃되었습니다.',
    });
  });
});
