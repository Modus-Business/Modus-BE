import { BadRequestException, Injectable } from '@nestjs/common';
import { hash } from 'bcryptjs';

@Injectable()
export class PasswordService {
  validateConfirmation(password: string, passwordConfirmation: string): void {
    if (password !== passwordConfirmation) {
      throw new BadRequestException(
        '비밀번호와 비밀번호 확인이 일치하지 않습니다.',
      );
    }
  }

  createHash(password: string): Promise<string> {
    return hash(password, 10);
  }
}
