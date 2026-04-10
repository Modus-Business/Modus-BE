import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LoginController } from './login/login.controller';
import { LoginService } from './login/login.service';
import { RefreshToken } from './login/refresh-token/entities/refresh-token.entity';
import { TokenService } from './login/token/token.service';
import { RefreshService } from './login/refresh-token/refresh.service';
import { RefreshTokenService } from './login/refresh-token/refresh-token.service';
import { LogoutController } from './logout/logout.controller';
import { LogoutService } from './logout/logout.service';
import { SignupController } from './signup/signup.controller';
import { PasswordService } from './signup/password.service';
import { SignupService } from './signup/signup.service';
import { User } from './signup/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, RefreshToken]),
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
    LoginService,
    SignupService,
    PasswordService,
    TokenService,
    RefreshTokenService,
    RefreshService,
    LogoutService,
  ],
  exports: [JwtAuthGuard, TokenService],
})
export class AuthModule {}
