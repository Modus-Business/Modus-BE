import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomInt } from 'node:crypto';
import { Repository } from 'typeorm';
import type { JwtPayload } from '../interfaces/jwt-payload.interface';
import { User } from '../signup/entities/user.entity';
import { SendVerificationEmailResponseDto } from './dto/send-verification-email.response.dto';
import { VerifyEmailResponseDto } from './dto/verify-email.response.dto';
import { EmailVerification } from './entities/email-verification.entity';
import { EmailSenderService } from './email-sender.service';

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const DIGITS = '0123456789';
const VERIFICATION_CODE_LENGTH = 6;
const VERIFICATION_EXPIRATION_MINUTES = 10;

@Injectable()
export class EmailVerificationService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(EmailVerification)
    private readonly emailVerificationRepository: Repository<EmailVerification>,
    private readonly emailSenderService: EmailSenderService,
  ) {}

  async sendVerificationCode(
    currentUser: JwtPayload,
  ): Promise<SendVerificationEmailResponseDto> {
    const user = await this.userRepository.findOne({
      where: {
        userId: currentUser.sub,
      },
    });

    if (!user) {
      throw new NotFoundException('사용자 정보를 찾을 수 없습니다.');
    }

    if (user.isEmailVerified) {
      throw new ConflictException('이미 이메일 인증이 완료된 계정입니다.');
    }

    const code = this.generateVerificationCode();
    const expiresAt = new Date(
      Date.now() + VERIFICATION_EXPIRATION_MINUTES * 60 * 1000,
    );

    const existingVerification =
      await this.emailVerificationRepository.findOne({
        where: {
          userId: user.userId,
        },
      });

    if (existingVerification) {
      existingVerification.code = code;
      existingVerification.expiresAt = expiresAt;
      await this.emailVerificationRepository.save(existingVerification);
    } else {
      const emailVerification = this.emailVerificationRepository.create({
        userId: user.userId,
        code,
        expiresAt,
      });

      await this.emailVerificationRepository.save(emailVerification);
    }

    await this.emailSenderService.sendVerificationCode(user.email, code);

    return {
      message: '인증 코드가 이메일로 발송되었습니다.',
      expiresAt,
    };
  }

  async verifyCode(
    currentUser: JwtPayload,
    code: string,
  ): Promise<VerifyEmailResponseDto> {
    const user = await this.userRepository.findOne({
      where: {
        userId: currentUser.sub,
      },
    });

    if (!user) {
      throw new NotFoundException('사용자 정보를 찾을 수 없습니다.');
    }

    if (user.isEmailVerified) {
      return {
        message: '이메일 인증이 이미 완료되었습니다.',
        isEmailVerified: true,
      };
    }

    const emailVerification = await this.emailVerificationRepository.findOne({
      where: {
        userId: user.userId,
      },
    });

    if (!emailVerification) {
      throw new NotFoundException('이메일 인증 요청을 먼저 진행해 주세요.');
    }

    if (emailVerification.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('인증 코드가 만료되었습니다.');
    }

    if (emailVerification.code !== code) {
      throw new BadRequestException('인증 코드가 올바르지 않습니다.');
    }

    user.isEmailVerified = true;
    await this.userRepository.save(user);
    await this.emailVerificationRepository.remove(emailVerification);

    return {
      message: '이메일 인증이 완료되었습니다.',
      isEmailVerified: true,
    };
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

    const code = values.join('');

    if (code.length !== VERIFICATION_CODE_LENGTH) {
      throw new Error('인증 코드 생성 길이가 올바르지 않습니다.');
    }

    return code;
  }
}
