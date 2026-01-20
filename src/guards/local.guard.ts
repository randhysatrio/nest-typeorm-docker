import { BadRequestException, HttpStatus } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { createApiResponse } from 'src/utils/response';

export class LocalAuthGuard extends AuthGuard('local') {
  handleRequest<TUser = any>(err: any, user: any, info: any): TUser {
    if (info?.message === 'Missing credentials') {
      throw new BadRequestException(
        createApiResponse(HttpStatus.BAD_REQUEST, false, 'Missing Credentials'),
      );
    }
    if (err) {
      throw err;
    }
    return user;
  }
}
