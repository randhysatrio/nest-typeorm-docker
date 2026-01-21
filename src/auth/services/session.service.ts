import {
  HttpStatus,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';

import { createApiResponse } from 'src/utils/response';

import { CurrUser } from 'src/decorators/user.decorator';

@Injectable()
export class SessionService {
  constructor(
    @Inject(CACHE_MANAGER)
    private readonly cache: Cache,
    private readonly config: ConfigService,
  ) {}

  private key(userId: string) {
    return `Auth:Session:${userId}`;
  }

  async create(user: CurrUser) {
    await this.cache.set(
      this.key(user.id),
      user,
      +this.config.getOrThrow('SESSION_EXPIRES_IN'),
    );
  }

  async get(userId: string) {
    return await this.cache.get<CurrUser>(this.key(userId));
  }

  async destroy(userId: string) {
    await this.cache.del(this.key(userId));
  }

  async validateSession(userId: string) {
    const session = await this.get(userId);

    if (!session) {
      throw new UnauthorizedException(
        createApiResponse(HttpStatus.UNAUTHORIZED, false, 'Session Not Found'),
      );
    }

    return session;
  }
}
