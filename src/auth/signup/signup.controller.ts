import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ApiErrorResponses } from '../../common/decorators/api-error-responses.decorator';
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
  @ApiOkResponse({
    description: '회원가입 전에 이메일 인증 코드를 발송합니다.',
    type: SendSignupVerificationResponseDto,
  })
  @ApiErrorResponses([400, 409, 500])
  async sendVerification(
    @Body() request: SendSignupVerificationRequestDto,
  ): Promise<SendSignupVerificationResponseDto> {
    return this.signupVerificationService.sendVerificationCode(request.email);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '이메일 인증 완료 후 회원가입' })
  @ApiCreatedResponse({
    description: '인증 코드를 검증한 뒤 회원가입을 완료합니다.',
    type: SignupResponseDto,
  })
  @ApiErrorResponses([400, 409, 500])
  async signup(@Body() request: SignupRequestDto): Promise<SignupResponseDto> {
    return this.signupService.signup(request);
  }
}
