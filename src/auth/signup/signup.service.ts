import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SignupRequestDto } from './dto/signup.request.dto';
import { SignupResponseDto } from './dto/signup.response.dto';
import { User } from './entities/user.entity';
import { PasswordService } from './password.service';
import { SignupVerificationService } from './signup-verification.service';

@Injectable()
export class SignupService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly passwordService: PasswordService,
    private readonly signupVerificationService: SignupVerificationService,
  ) {}

  async signup(request: SignupRequestDto): Promise<SignupResponseDto> {
    const normalizedName = request.name.trim();
    const normalizedEmail = request.email.trim().toLowerCase();

    this.passwordService.validateConfirmation(
      request.password,
      request.passwordConfirmation,
    );

    const existingUser = await this.userRepository.findOne({
      where: {
        email: normalizedEmail,
      },
    });

    if (existingUser) {
      throw new ConflictException('이미 사용 중인 이메일입니다.');
    }

    await this.signupVerificationService.verifyCode(
      normalizedEmail,
      request.verificationCode,
    );

    const passwordHash = await this.passwordService.createHash(request.password);
    const user = this.userRepository.create({
      name: normalizedName,
      email: normalizedEmail,
      passwordHash,
      role: request.role,
      isEmailVerified: true,
    });

    const savedUser = await this.userRepository.save(user);
    await this.signupVerificationService.consume(normalizedEmail);

    return {
      userId: savedUser.userId,
      name: savedUser.name,
      email: savedUser.email,
      role: savedUser.role,
      isEmailVerified: savedUser.isEmailVerified,
      createdAt: savedUser.createdAt,
    };
  }
}
