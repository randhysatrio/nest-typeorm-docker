import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

import { createApiResponse } from 'src/utils/response';

@Catch()
export class GlobalExceptionFiler implements ExceptionFilter {
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  private readonly logger = new Logger(GlobalExceptionFiler.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;

    const ctx = host.switchToHttp();
    const request = ctx.getRequest();

    const httpStatus =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const message =
      exception instanceof HttpException
        ? exception.message
        : 'Internal Server Error';
    const response =
      exception instanceof HttpException ? exception.getResponse() : null;

    this.logger.error(`${message} from URL: ${request.url}`);
    this.logger.debug(exception);

    httpAdapter.reply(
      ctx.getResponse(),
      createApiResponse(
        httpStatus,
        false,
        message,
        response && typeof response === 'object' && 'data' in response
          ? response.data
          : null,
      ),
      httpStatus,
    );
  }
}
