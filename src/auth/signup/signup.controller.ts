import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SendSignupVerificationRequestDto } from './dto/send-signup-verification.request.dto';
import { SendSignupVerificationResponseDto } from './dto/send-signup-verification.response.dto';
import { SignupRequestDto } from './dto/signup.request.dto';
import { SignupResponseDto } from './dto/signup.response.dto';
import { SignupService } from './signup.service';
import { SignupVerificationService } from './signup-verification.service';

@ApiTags('auth')
@Controller('auth/signup')
export class SignupController {
  constructor(
    private readonly signupService: SignupService,
    private readonly signupVerificationService: SignupVerificationService,
  ) {}

  @Post('send-verification')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '회원가입용 이메일 인증 코드 발송' })
  async sendVerification(
    @Body() request: SendSignupVerificationRequestDto,
  ): Promise<SendSignupVerificationResponseDto> {
    return this.signupVerificationService.sendVerificationCode(request.email);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '이메일 인증 완료 후 회원가입' })
  async signup(@Body() request: SignupRequestDto): Promise<SignupResponseDto> {
    return this.signupService.signup(request);
  }
}
