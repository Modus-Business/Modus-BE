import { InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { UserRole } from '../../signup/enums/user-role.enum';
import { User } from '../../signup/entities/user.entity';
import { TokenService } from './token.service';

describe('TokenService', () => {
  let tokenService: TokenService;
  let jwtService: {
    sign: jest.Mock<string, [object, object]>;
    decode: jest.Mock<object | null, [string]>;
    verify: jest.Mock<object, [string, object]>;
  };
  let configService: {
    get: jest.Mock<string | undefined, [string, (string | undefined)?]>;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenService,
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            decode: jest.fn(),
            verify: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    tokenService = module.get<TokenService>(TokenService);
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);
  });

  it('access token 생성 시 설정된 secret과 만료시간을 사용한다', () => {
    const user = createUser();

    configService.get.mockImplementation((key: string, defaultValue?: string) => {
      if (key === 'JWT_SECRET') {
        return 'access-secret';
      }

      if (key === 'JWT_ACCESS_TOKEN_EXPIRES_IN') {
        return defaultValue ?? '15m';
      }

      return defaultValue;
    });
    jwtService.sign.mockReturnValue('signed-access-token');

    const result = tokenService.createAccessToken(user);

    expect(result).toBe('signed-access-token');
    expect(jwtService.sign).toHaveBeenCalledWith(
      {
        sub: 'user-1',
        email: 'user@example.com',
        role: UserRole.STUDENT,
      },
      {
        secret: 'access-secret',
        expiresIn: '15m',
      },
    );
  });

  it('필수 refresh secret이 없으면 예외를 던진다', () => {
    const user = createUser();

    configService.get.mockImplementation((key: string, defaultValue?: string) => {
      if (key === 'JWT_REFRESH_SECRET') {
        return undefined;
      }

      return defaultValue;
    });

    expect(() => tokenService.createRefreshToken(user)).toThrow(
      InternalServerErrorException,
    );
  });

  it('refresh token 검증 시 refresh secret을 사용한다', () => {
    configService.get.mockImplementation((key: string, defaultValue?: string) => {
      if (key === 'JWT_REFRESH_SECRET') {
        return 'refresh-secret';
      }

      return defaultValue;
    });
    jwtService.verify.mockReturnValue({
      sub: 'user-1',
      email: 'user@example.com',
      role: UserRole.STUDENT,
    });

    const result = tokenService.verifyRefreshToken('refresh-token');

    expect(result).toEqual({
      sub: 'user-1',
      email: 'user@example.com',
      role: UserRole.STUDENT,
    });
    expect(jwtService.verify).toHaveBeenCalledWith('refresh-token', {
      secret: 'refresh-secret',
    });
  });

  it('refresh token 검증이 실패하면 UnauthorizedException을 던진다', () => {
    configService.get.mockImplementation((key: string, defaultValue?: string) => {
      if (key === 'JWT_REFRESH_SECRET') {
        return 'refresh-secret';
      }

      return defaultValue;
    });
    jwtService.verify.mockImplementation(() => {
      throw new Error('invalid token');
    });

    expect(() => tokenService.verifyRefreshToken('invalid-token')).toThrow(
      UnauthorizedException,
    );
  });

  it('decode 결과에서 refresh token 만료 시간을 계산한다', () => {
    jwtService.decode.mockReturnValue({
      exp: 1_800_000_000,
    });

    const expiresAt = tokenService.getRefreshTokenExpiresAt('refresh-token');

    expect(expiresAt).toEqual(new Date(1_800_000_000 * 1000));
  });
});

function createUser(): User {
  return {
    userId: 'user-1',
    name: '홍길동',
    email: 'user@example.com',
    passwordHash: 'hashed-password',
    role: UserRole.STUDENT,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}
