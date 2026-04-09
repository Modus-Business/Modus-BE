import { Injectable } from '@nestjs/common';
import { SignupRequestDto } from './dto/signup.request.dto';
import { SignupResponseDto } from './dto/signup.response.dto';

@Injectable()
export class SignupService {
  signup(request: SignupRequestDto): SignupResponseDto {
    return {
      name: request.name,
      email: request.email,
      role: request.role,
      message: 'signup setup complete',
    };
  }
}
