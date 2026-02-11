import {
  HttpStatus,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';

import { createApiResponse } from 'src/utils/response';

@Injectable()
export class OtpService {
  constructor(
    @Inject(CACHE_MANAGER)
    private readonly cache: Cache,
    private readonly config: ConfigService,
  ) {}

  private generateCode() {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }

  private key(email: string) {
    return `Auth:Otp:${email}`;
  }

  async issue(email: string) {
    const code = this.generateCode();

    await this.cache.set(
      this.key(email),
      code,
      +this.config.getOrThrow('OTP_EXPIRES_IN'),
    );

    return code; // send via email/SMS elsewhere
  }

  async verify(email: string, code: string) {
    const stored = await this.cache.get<string>(this.key(email));

    if (stored !== code) {
      throw new UnauthorizedException(
        createApiResponse(HttpStatus.UNAUTHORIZED, false, 'Invalid OTP Code'),
      );
    }

    await this.cache.del(this.key(email));
  }

  // ======== TESTING METHOD ========
  async __getOtpForTest(email: string) {
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('Test-only method');
    }
    return (await this.cache.get<string>(this.key(email))) ?? '1234';
  }
}
