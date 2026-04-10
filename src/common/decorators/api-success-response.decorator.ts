import { applyDecorators, Type } from '@nestjs/common';
import {
  ApiExtraModels,
  ApiOkResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { SuccessResponseDto } from '../dto/success.response.dto';

interface ApiSuccessResponseOptions {
  type: Type<unknown>;
  description: string;
  pathExample: string;
  statusCode?: number;
}

export function ApiSuccessResponse(
  options: ApiSuccessResponseOptions,
): MethodDecorator {
  const statusCode = options.statusCode ?? 200;

  return applyDecorators(
    ApiExtraModels(SuccessResponseDto, options.type),
    ApiOkResponse({
      description: options.description,
      schema: {
        allOf: [
          { $ref: getSchemaPath(SuccessResponseDto) },
          {
            type: 'object',
            properties: {
              statusCode: {
                type: 'number',
                example: statusCode,
              },
              path: {
                type: 'string',
                example: options.pathExample,
              },
              data: {
                $ref: getSchemaPath(options.type),
              },
            },
          },
        ],
      },
    }),
  );
}
