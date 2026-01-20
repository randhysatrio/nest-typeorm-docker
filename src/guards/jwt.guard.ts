import {
  BadRequestException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { AuthGuard } from '@nestjs/passport';

import { createApiResponse } from 'src/utils/response';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = any>(err: any, user: any, info: any): TUser {
    if (info?.message === 'jwt malformed') {
      throw new BadRequestException(
        createApiResponse(HttpStatus.BAD_REQUEST, false, 'Invalid Token'),
      );
    }
    if (info?.message === 'No auth token' || info?.message === 'jwt expired') {
      throw new UnauthorizedException(
        createApiResponse(
          HttpStatus.UNAUTHORIZED,
          false,
          'Invalid Credentials',
        ),
      );
    }
    if (err) {
      throw err;
    }
    return user;
  }
}
