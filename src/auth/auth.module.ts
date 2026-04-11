import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailSenderService } from './email/email-sender.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { LoginController } from './login/login.controller';
import { LoginService } from './login/login.service';
import { RefreshService } from './login/refresh-token/refresh.service';
import { RefreshToken } from './login/refresh-token/entities/refresh-token.entity';
import { RefreshTokenService } from './login/refresh-token/refresh-token.service';
import { TokenService } from './login/token/token.service';
import { LogoutController } from './logout/logout.controller';
import { LogoutService } from './logout/logout.service';
import { PasswordService } from './signup/password.service';
import { SignupController } from './signup/signup.controller';
import { SignupService } from './signup/signup.service';
import { SignupVerificationService } from './signup/signup-verification.service';
import { User } from './signup/entities/user.entity';
import { SignupVerification } from './signup/entities/signup-verification.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, RefreshToken, SignupVerification]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const jwtSecret = configService.get<string>('JWT_SECRET');

        if (!jwtSecret) {
          throw new Error('JWT_SECRET 환경변수가 설정되지 않았습니다.');
        }

        return {
          secret: jwtSecret,
        };
      },
    }),
  ],
  controllers: [LoginController, LogoutController, SignupController],
  providers: [
    JwtAuthGuard,
    RolesGuard,
    LoginService,
    SignupService,
    SignupVerificationService,
    PasswordService,
    TokenService,
    RefreshTokenService,
    RefreshService,
    LogoutService,
    EmailSenderService,
  ],
  exports: [
    JwtAuthGuard,
    RolesGuard,
    TokenService,
    EmailSenderService,
    SignupVerificationService,
  ],
})
export class AuthModule {}
