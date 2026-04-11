import { Controller, Get } from '@nestjs/common';
import {
  ApiExtraModels,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { GetRootSuccessResponseDto, RootDataResponseDto } from './app/dto/root-get.response.dto';
import { AppService } from './app.service';
import { ApiErrorResponses } from './common/decorators/api-error-responses.decorator';

@ApiTags('misc')
@ApiExtraModels(RootDataResponseDto, GetRootSuccessResponseDto)
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: '서버 기본 응답 확인' })
  @ApiOkResponse({
    description: '서버 기본 응답을 반환합니다.',
    type: GetRootSuccessResponseDto,
  })
  @ApiErrorResponses([500])
  getHello(): string {
    return this.appService.getHello();
  }
}
