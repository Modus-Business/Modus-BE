import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailController } from './email/email.controller';
import { EmailSenderService } from './email/email-sender.service';
import { EmailVerificationService } from './email/email-verification.service';
import { EmailVerification } from './email/entities/email-verification.entity';
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
import { User } from './signup/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, RefreshToken, EmailVerification]),
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
  controllers: [
    LoginController,
    LogoutController,
    SignupController,
    EmailController,
  ],
  providers: [
    JwtAuthGuard,
    RolesGuard,
    LoginService,
    SignupService,
    PasswordService,
    TokenService,
    RefreshTokenService,
    RefreshService,
    LogoutService,
    EmailSenderService,
    EmailVerificationService,
  ],
  exports: [
    JwtAuthGuard,
    RolesGuard,
    TokenService,
    EmailSenderService,
    EmailVerificationService,
  ],
})
export class AuthModule {}
