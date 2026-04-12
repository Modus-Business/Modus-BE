import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Socket } from 'socket.io';

interface WsErrorResponse {
  success: false;
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp: string;
  event: string;
}

@Catch()
export class WsExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToWs();
    const client = context.getClient<Socket>();
    const pattern = String(context.getPattern() ?? 'unknown');
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

    const payload: WsErrorResponse = {
      success: false,
      statusCode,
      message,
      error,
      timestamp: new Date().toISOString(),
      event: pattern,
    };

    client.emit('chat.error', payload);
  }

  private extractErrorPayload(
    exceptionResponse: string | object | null,
    statusCode: number,
  ): Pick<WsErrorResponse, 'message' | 'error'> {
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
      message: '서버 오류가 발생했습니다.',
      error: this.defaultError(statusCode),
    };
  }

  private defaultError(statusCode: number): string {
    return HttpStatus[statusCode] ?? 'Internal Server Error';
  }
}
