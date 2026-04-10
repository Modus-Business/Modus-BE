import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { hash } from 'bcryptjs';
import { Repository } from 'typeorm';
import { RefreshTokenService } from './refresh-token/refresh-token.service';
import { TokenService } from './token/token.service';
import { UserRole } from '../signup/enums/user-role.enum';
import { User } from '../signup/entities/user.entity';
import { LoginService } from './login.service';

describe('LoginService', () => {
  let loginService: LoginService;
  let userRepository: jest.Mocked<Repository<User>>;
  let tokenService: {
    createAccessToken: jest.Mock<string, [User]>;
    createRefreshToken: jest.Mock<string, [User]>;
  };
  let refreshTokenService: {
    save: jest.Mock<Promise<void>, [string, string]>;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoginService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: TokenService,
          useValue: {
            createAccessToken: jest.fn(),
            createRefreshToken: jest.fn(),
          },
        },
        {
          provide: RefreshTokenService,
          useValue: {
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    loginService = module.get<LoginService>(LoginService);
    userRepository = module.get(getRepositoryToken(User));
    tokenService = module.get(TokenService);
    refreshTokenService = module.get(RefreshTokenService);
  });

  it('정규화한 이메일로 로그인하고 access token과 refresh token을 발급한다', async () => {
    const passwordHash = await hash('Password123!', 4);
    const user = createUser(passwordHash);

    userRepository.findOne.mockResolvedValue(user);
    tokenService.createAccessToken.mockReturnValue('access-token');
    tokenService.createRefreshToken.mockReturnValue('refresh-token');
    refreshTokenService.save.mockResolvedValue();

    const result = await loginService.login({
      email: ' User@Example.com ',
      password: 'Password123!',
    });

    expect(userRepository.findOne).toHaveBeenCalledWith({
      where: {
        email: 'user@example.com',
      },
    });
    expect(tokenService.createAccessToken).toHaveBeenCalledWith(user);
    expect(tokenService.createRefreshToken).toHaveBeenCalledWith(user);
    expect(refreshTokenService.save).toHaveBeenCalledWith(
      'user-1',
      'refresh-token',
    );
    expect(result).toEqual({
      tokenType: 'Bearer',
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      email: 'user@example.com',
    });
  });

  it('사용자가 없으면 UnauthorizedException을 던진다', async () => {
    userRepository.findOne.mockResolvedValue(null);

    await expect(
      loginService.login({
        email: 'missing@example.com',
        password: 'Password123!',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('비밀번호가 다르면 UnauthorizedException을 던진다', async () => {
    userRepository.findOne.mockResolvedValue(
      createUser(await hash('OtherPassword123!', 4)),
    );

    await expect(
      loginService.login({
        email: 'user@example.com',
        password: 'Password123!',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});

function createUser(passwordHash = 'hashed-password'): User {
  return {
    userId: 'user-1',
    name: '홍길동',
    email: 'user@example.com',
    passwordHash,
    role: UserRole.STUDENT,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}
