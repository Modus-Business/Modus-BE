import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiExtraModels,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import {
  ErrorResponseDto,
  ValidationErrorResponseDto,
} from '../dto/error.response.dto';

type ErrorStatus = 400 | 401 | 403 | 404 | 409 | 500;

const ERROR_CONFIG: Record<
  ErrorStatus,
  {
    description: string;
    example: string | string[];
    error: string;
    decorator: (options: {
      description: string;
      schema: Record<string, unknown>;
    }) => MethodDecorator & ClassDecorator;
  }
> = {
  400: {
    description: '요청 형식이나 검증 규칙이 올바르지 않습니다.',
    example: ['field should not be empty'],
    error: 'Bad Request',
    decorator: ApiBadRequestResponse,
  },
  401: {
    description: '인증이 필요하거나 토큰이 유효하지 않습니다.',
    example: '인증이 필요합니다.',
    error: 'Unauthorized',
    decorator: ApiUnauthorizedResponse,
  },
  403: {
    description: '현재 사용자에게 이 작업을 수행할 권한이 없습니다.',
    example: '접근 권한이 없습니다.',
    error: 'Forbidden',
    decorator: ApiForbiddenResponse,
  },
  404: {
    description: '요청한 리소스를 찾을 수 없습니다.',
    example: '해당 리소스를 찾을 수 없습니다.',
    error: 'Not Found',
    decorator: ApiNotFoundResponse,
  },
  409: {
    description: '현재 리소스 상태와 충돌하는 요청입니다.',
    example: '이미 처리된 요청입니다.',
    error: 'Conflict',
    decorator: ApiConflictResponse,
  },
  500: {
    description: '서버 내부 오류가 발생했습니다.',
    example: '서버 내부 오류가 발생했습니다.',
    error: 'Internal Server Error',
    decorator: ApiInternalServerErrorResponse,
  },
};

export function ApiErrorResponses(statuses: ErrorStatus[]): MethodDecorator {
  const uniqueStatuses = Array.from(new Set(statuses));

  return applyDecorators(
    ApiExtraModels(ErrorResponseDto, ValidationErrorResponseDto),
    ...uniqueStatuses.map((status) => {
      const config = ERROR_CONFIG[status];
      const schemaRef =
        status === 400
          ? getSchemaPath(ValidationErrorResponseDto)
          : getSchemaPath(ErrorResponseDto);

      return config.decorator({
        description: config.description,
        schema: {
          allOf: [
            { $ref: schemaRef },
            {
              type: 'object',
              properties: {
                statusCode: { example: status },
                message: { example: config.example },
                error: { example: config.error },
              },
            },
          ],
        },
      });
    }),
  );
}
