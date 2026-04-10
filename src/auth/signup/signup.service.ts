import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { hash } from 'bcryptjs';
import { Repository } from 'typeorm';
import { SignupRequestDto } from './dto/signup.request.dto';
import { SignupResponseDto } from './dto/signup.response.dto';
import { User } from './entities/user.entity';

@Injectable()
export class SignupService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async signup(request: SignupRequestDto): Promise<SignupResponseDto> {
    const normalizedName = request.name.trim();
    const normalizedEmail = request.email.trim().toLowerCase();
    const normalizedPassword = request.password;
    const normalizedPasswordConfirmation = request.passwordConfirmation;

    if (normalizedPassword !== normalizedPasswordConfirmation) {
      throw new BadRequestException('비밀번호와 비밀번호 확인이 일치하지 않습니다.');
    }

    const existingUser = await this.userRepository.findOne({
      where: {
        email: normalizedEmail,
      },
    });

    if (existingUser) {
      throw new ConflictException('이미 사용 중인 이메일입니다.');
    }

    const passwordHash = await hash(normalizedPassword, 10);
    const user = this.userRepository.create({
      name: normalizedName,
      email: normalizedEmail,
      passwordHash,
      role: request.role,
    });

    const savedUser = await this.userRepository.save(user);

    return {
      userId: savedUser.userId,
      name: savedUser.name,
      email: savedUser.email,
      role: savedUser.role,
      createdAt: savedUser.createdAt,
    };
  }
}
