import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface ErrorResponse {
  success: false;
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp: string;
  path: string;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();

    const statusCode =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : null;

    const { message, error } = this.extractErrorPayload(
      exceptionResponse,
      statusCode,
    );

    const payload: ErrorResponse = {
      success: false,
      statusCode,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(statusCode).json(payload);
  }

  private extractErrorPayload(
    exceptionResponse: string | object | null,
    statusCode: number,
  ): Pick<ErrorResponse, 'message' | 'error'> {
    if (typeof exceptionResponse === 'string') {
      return {
        message: exceptionResponse,
        error: this.defaultError(statusCode),
      };
    }

    if (
      exceptionResponse &&
      typeof exceptionResponse === 'object' &&
      'message' in exceptionResponse
    ) {
      const message = (exceptionResponse as { message: string | string[] })
        .message;
      const error =
        'error' in exceptionResponse
          ? String((exceptionResponse as { error?: unknown }).error)
          : this.defaultError(statusCode);

      return {
        message,
        error,
      };
    }

    return {
      message: '서버 내부 오류가 발생했습니다.',
      error: this.defaultError(statusCode),
    };
  }

  private defaultError(statusCode: number): string {
    return HttpStatus[statusCode] ?? 'Internal Server Error';
  }
}
