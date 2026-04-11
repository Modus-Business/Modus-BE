import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomInt } from 'node:crypto';
import { Repository } from 'typeorm';
import { EmailSenderService } from '../email/email-sender.service';
import { SendSignupVerificationResponseDto } from './dto/send-signup-verification.response.dto';
import { User } from './entities/user.entity';
import { SignupVerification } from './entities/signup-verification.entity';

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const DIGITS = '0123456789';
const VERIFICATION_CODE_LENGTH = 6;
const VERIFICATION_EXPIRATION_MINUTES = 10;
const RESEND_COOLDOWN_SECONDS = 60;
const MAX_FAILED_ATTEMPTS = 5;

@Injectable()
export class SignupVerificationService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(SignupVerification)
    private readonly signupVerificationRepository: Repository<SignupVerification>,
    private readonly emailSenderService: EmailSenderService,
  ) {}

  async sendVerificationCode(
    email: string,
  ): Promise<SendSignupVerificationResponseDto> {
    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await this.userRepository.findOne({
      where: {
        email: normalizedEmail,
      },
    });

    if (existingUser) {
      throw new ConflictException('이미 사용 중인 이메일입니다.');
    }

    const now = new Date();
    const code = this.generateVerificationCode();
    const expiresAt = new Date(
      now.getTime() + VERIFICATION_EXPIRATION_MINUTES * 60 * 1000,
    );
    const existingVerification =
      await this.signupVerificationRepository.findOne({
        where: {
          email: normalizedEmail,
        },
      });

    if (
      existingVerification?.lastSentAt &&
      existingVerification.lastSentAt.getTime() + RESEND_COOLDOWN_SECONDS * 1000 >
        now.getTime()
    ) {
      throw new HttpException(
        `${RESEND_COOLDOWN_SECONDS}초 후에 인증 코드를 다시 요청해 주세요.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    if (existingVerification) {
      existingVerification.code = code;
      existingVerification.expiresAt = expiresAt;
      existingVerification.lastSentAt = now;
      existingVerification.failedAttemptCount = 0;
      await this.signupVerificationRepository.save(existingVerification);
    } else {
      const signupVerification = this.signupVerificationRepository.create({
        email: normalizedEmail,
        code,
        expiresAt,
        lastSentAt: now,
        failedAttemptCount: 0,
      });

      await this.signupVerificationRepository.save(signupVerification);
    }

    await this.emailSenderService.sendVerificationCode(normalizedEmail, code);

    return {
      message: '인증 코드가 이메일로 발송되었습니다.',
      expiresAt,
    };
  }

  async verifyCode(email: string, code: string): Promise<void> {
    const normalizedEmail = email.trim().toLowerCase();
    const signupVerification = await this.signupVerificationRepository.findOne({
      where: {
        email: normalizedEmail,
      },
    });

    if (!signupVerification) {
      throw new BadRequestException('이메일 인증 요청을 먼저 진행해 주세요.');
    }

    if (signupVerification.expiresAt.getTime() < Date.now()) {
      await this.signupVerificationRepository.remove(signupVerification);
      throw new BadRequestException('인증 코드가 만료되었습니다.');
    }

    if (signupVerification.code !== code) {
      signupVerification.failedAttemptCount += 1;

      if (signupVerification.failedAttemptCount >= MAX_FAILED_ATTEMPTS) {
        await this.signupVerificationRepository.remove(signupVerification);
        throw new HttpException(
          '인증 시도 횟수를 초과했습니다. 새 코드를 요청해 주세요.',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      await this.signupVerificationRepository.save(signupVerification);
      throw new BadRequestException('인증 코드가 올바르지 않습니다.');
    }
  }

  async consume(email: string): Promise<void> {
    const normalizedEmail = email.trim().toLowerCase();
    const signupVerification = await this.signupVerificationRepository.findOne({
      where: {
        email: normalizedEmail,
      },
    });

    if (!signupVerification) {
      return;
    }

    await this.signupVerificationRepository.remove(signupVerification);
  }

  private generateVerificationCode(): string {
    const letters = Array.from({ length: 3 }, () => {
      return LETTERS[randomInt(0, LETTERS.length)];
    });
    const digits = Array.from({ length: 3 }, () => {
      return DIGITS[randomInt(0, DIGITS.length)];
    });
    const values = [...letters, ...digits];

    for (let index = values.length - 1; index > 0; index -= 1) {
      const swapIndex = randomInt(0, index + 1);
      [values[index], values[swapIndex]] = [values[swapIndex], values[index]];
    }

    const generatedCode = values.join('');

    if (generatedCode.length !== VERIFICATION_CODE_LENGTH) {
      throw new Error('인증 코드 생성 길이가 올바르지 않습니다.');
    }

    return generatedCode;
  }
}
