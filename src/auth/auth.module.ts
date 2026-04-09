import { Module } from '@nestjs/common';
import { LoginController } from './login/login.controller';
import { LoginService } from './login/login.service';
import { SignupController } from './signup/signup.controller';
import { SignupService } from './signup/signup.service';

@Module({
  controllers: [LoginController, SignupController],
  providers: [LoginService, SignupService],
})
export class AuthModule {}
