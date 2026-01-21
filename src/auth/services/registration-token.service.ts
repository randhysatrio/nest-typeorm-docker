import {
  HttpStatus,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { JwtService } from '@nestjs/jwt';

import { createApiResponse } from 'src/utils/response';

@Injectable()
export class RegistrationTokenService {
  constructor(
    private readonly config: ConfigService,
    private readonly jwt: JwtService,
    @Inject(CACHE_MANAGER)
    private readonly cache: Cache,
  ) {}

  private key(jti: string) {
    return `Auth:Registration:${jti}`;
  }

  async issue(email: string): Promise<string> {
    const jti = crypto.randomUUID();

    await this.cache.set(
      this.key(jti),
      email,
      +this.config.getOrThrow('REGISTRATION_SESSION_EXPIRES_IN'),
    );

    return this.jwt.sign(
      {
        jti,
        email,
        scope: 'registration',
      },
      {
        secret: this.config.getOrThrow('REGISTRATION_TOKEN_SECRET'),
        expiresIn: this.config.getOrThrow('REGISTRATION_TOKEN_EXPIRES_IN'),
      },
    );
  }

  async consume(token: string): Promise<string> {
    let payload: { jti: string; email: string; scope: string } = {
      jti: '',
      email: '',
      scope: '',
    };

    try {
      payload = this.jwt.verify(token, {
        secret: this.config.getOrThrow('REGISTRATION_TOKEN_SECRET'),
      });
    } catch {
      throw new UnauthorizedException(
        createApiResponse(
          HttpStatus.UNAUTHORIZED,
          false,
          'Invalid Registration Token',
        ),
      );
    }

    if (payload.scope !== 'registration') {
      throw new UnauthorizedException(
        createApiResponse(
          HttpStatus.UNAUTHORIZED,
          false,
          'Invalid Registration Token',
        ),
      );
    }

    const email = await this.cache.get<string>(this.key(payload.jti));
    if (!email || email !== payload.email) {
      throw new UnauthorizedException(
        createApiResponse(
          HttpStatus.UNAUTHORIZED,
          false,
          'Invalid or Expired Registration Token',
        ),
      );
    }

    await this.cache.del(this.key(payload.jti));

    return email;
  }
}
