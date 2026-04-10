import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../decorators/current-user.decorator';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import type { JwtPayload } from '../interfaces/jwt-payload.interface';
import { SendVerificationEmailResponseDto } from './dto/send-verification-email.response.dto';
import { VerifyEmailRequestDto } from './dto/verify-email.request.dto';
import { VerifyEmailResponseDto } from './dto/verify-email.response.dto';
import { EmailVerificationService } from './email-verification.service';

@ApiTags('auth')
@ApiBearerAuth('access-token')
@Controller('auth/email')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EmailController {
  constructor(
    private readonly emailVerificationService: EmailVerificationService,
  ) {}

  @Post('send-verification')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '이메일 인증 코드 발송' })
  async sendVerification(
    @CurrentUser() currentUser: JwtPayload,
  ): Promise<SendVerificationEmailResponseDto> {
    return this.emailVerificationService.sendVerificationCode(currentUser);
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '이메일 인증 코드 검증' })
  async verifyEmail(
    @CurrentUser() currentUser: JwtPayload,
    @Body() request: VerifyEmailRequestDto,
  ): Promise<VerifyEmailResponseDto> {
    return this.emailVerificationService.verifyCode(currentUser, request.code);
  }
}
