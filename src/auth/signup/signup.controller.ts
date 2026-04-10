import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SignupRequestDto } from './dto/signup.request.dto';
import { SignupResponseDto } from './dto/signup.response.dto';
import { SignupService } from './signup.service';

@ApiTags('auth')
@Controller('auth/signup')
export class SignupController {
  constructor(private readonly signupService: SignupService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '회원가입' })
  async signup(@Body() request: SignupRequestDto): Promise<SignupResponseDto> {
    return this.signupService.signup(request);
  }
}
