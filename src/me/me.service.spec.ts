import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRole } from '../auth/signup/enums/user-role.enum';
import { User } from '../auth/signup/entities/user.entity';
import { MeService } from './me.service';

describe('MeService', () => {
  let meService: MeService;
  let userRepository: jest.Mocked<Repository<User>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MeService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    meService = module.get<MeService>(MeService);
    userRepository = module.get(getRepositoryToken(User));
  });

  it('설정 화면용 내 정보를 반환한다', async () => {
    userRepository.findOne.mockResolvedValue({
      userId: 'user-1',
      name: '최민수',
      email: 'user@example.com',
      passwordHash: 'hashed-password',
      isEmailVerified: false,
      role: UserRole.STUDENT,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as User);

    const result = await meService.getSettings({
      sub: 'user-1',
      email: 'user@example.com',
      role: UserRole.STUDENT,
    });

    expect(result).toEqual({
      name: '최민수',
      email: 'user@example.com',
      isEmailVerified: false,
      role: UserRole.STUDENT,
    });
  });

  it('사용자가 없으면 NotFoundException을 던진다', async () => {
    userRepository.findOne.mockResolvedValue(null);

    await expect(
      meService.getSettings({
        sub: 'missing-user',
        email: 'missing@example.com',
        role: UserRole.STUDENT,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
