import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRole } from '../signup/enums/user-role.enum';
import { User } from '../signup/entities/user.entity';
import { EmailSenderService } from './email-sender.service';
import { EmailVerificationService } from './email-verification.service';
import { EmailVerification } from './entities/email-verification.entity';

describe('EmailVerificationService', () => {
  let emailVerificationService: EmailVerificationService;
  let userRepository: jest.Mocked<Repository<User>>;
  let emailVerificationRepository: jest.Mocked<Repository<EmailVerification>>;
  let emailSenderService: jest.Mocked<EmailSenderService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailVerificationService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(EmailVerification),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: EmailSenderService,
          useValue: {
            sendVerificationCode: jest.fn(),
          },
        },
      ],
    }).compile();

    emailVerificationService = module.get(EmailVerificationService);
    userRepository = module.get(getRepositoryToken(User));
    emailVerificationRepository = module.get(
      getRepositoryToken(EmailVerification),
    );
    emailSenderService = module.get(EmailSenderService);
  });

  it('generates a mixed verification code and sends email', async () => {
    userRepository.findOne.mockResolvedValue({
      userId: 'user-1',
      email: 'user@example.com',
      isEmailVerified: false,
    } as User);
    emailVerificationRepository.findOne.mockResolvedValue(null);
    emailVerificationRepository.create.mockImplementation(
      (input) => input as EmailVerification,
    );
    emailVerificationRepository.save.mockResolvedValue({} as never);

    await emailVerificationService.sendVerificationCode({
      sub: 'user-1',
      email: 'user@example.com',
      role: UserRole.STUDENT,
    });

    expect(emailSenderService.sendVerificationCode).toHaveBeenCalledTimes(1);
    const sentCode = emailSenderService.sendVerificationCode.mock.calls[0][1];
    expect(sentCode).toMatch(/^(?=(?:.*[A-Za-z]){3})(?=(?:.*\d){3})[A-Za-z\d]{6}$/);
  });

  it('verifies email when the code matches', async () => {
    userRepository.findOne.mockResolvedValue({
      userId: 'user-1',
      email: 'user@example.com',
      isEmailVerified: false,
    } as User);
    emailVerificationRepository.findOne.mockResolvedValue({
      emailVerificationId: 'verification-1',
      userId: 'user-1',
      code: 'A1b2C3',
      expiresAt: new Date(Date.now() + 60_000),
    } as EmailVerification);
    userRepository.save.mockResolvedValue({} as never);
    emailVerificationRepository.remove.mockResolvedValue({} as never);

    const result = await emailVerificationService.verifyCode(
      {
        sub: 'user-1',
        email: 'user@example.com',
        role: UserRole.STUDENT,
      },
      'A1b2C3',
    );

    expect(result).toEqual({
      message: '이메일 인증이 완료되었습니다.',
      isEmailVerified: true,
    });
  });

  it('throws when email is already verified', async () => {
    userRepository.findOne.mockResolvedValue({
      userId: 'user-1',
      email: 'user@example.com',
      isEmailVerified: true,
    } as User);

    await expect(
      emailVerificationService.sendVerificationCode({
        sub: 'user-1',
        email: 'user@example.com',
        role: UserRole.STUDENT,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('throws when verification code is expired', async () => {
    userRepository.findOne.mockResolvedValue({
      userId: 'user-1',
      email: 'user@example.com',
      isEmailVerified: false,
    } as User);
    emailVerificationRepository.findOne.mockResolvedValue({
      emailVerificationId: 'verification-1',
      userId: 'user-1',
      code: 'A1b2C3',
      expiresAt: new Date(Date.now() - 60_000),
    } as EmailVerification);

    await expect(
      emailVerificationService.verifyCode(
        {
          sub: 'user-1',
          email: 'user@example.com',
          role: UserRole.STUDENT,
        },
        'A1b2C3',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('throws when no verification request exists', async () => {
    userRepository.findOne.mockResolvedValue({
      userId: 'user-1',
      email: 'user@example.com',
      isEmailVerified: false,
    } as User);
    emailVerificationRepository.findOne.mockResolvedValue(null);

    await expect(
      emailVerificationService.verifyCode(
        {
          sub: 'user-1',
          email: 'user@example.com',
          role: UserRole.STUDENT,
        },
        'A1b2C3',
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
