import { Injectable } from '@nestjs/common';
import { LoginRequestDto } from './dto/login.request.dto';
import { LoginResponseDto } from './dto/login.response.dto';

@Injectable()
export class LoginService {
  login(request: LoginRequestDto): LoginResponseDto {
    return {
      accessToken: 'todo-access-token',
      email: request.email,
    };
  }
}
