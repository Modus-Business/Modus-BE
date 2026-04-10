import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { User } from '../auth/signup/entities/user.entity';
import { MeSettingsResponseDto } from './dto/me-settings.response.dto';

@Injectable()
export class MeService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async getSettings(currentUser: JwtPayload): Promise<MeSettingsResponseDto> {
    const user = await this.userRepository.findOne({
      where: {
        userId: currentUser.sub,
      },
    });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    return {
      name: user.name,
      email: user.email,
      isEmailVerified: user.isEmailVerified,
      role: user.role,
    };
  }
}
