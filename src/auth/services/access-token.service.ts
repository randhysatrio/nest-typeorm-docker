import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import { CurrUser } from 'src/decorators/user.decorator';

@Injectable()
export class AccessTokenService {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  create(user: CurrUser) {
    return this.jwtService.sign(
      { sub: user.id, email: user.email },
      { expiresIn: this.configService.getOrThrow('JWT_EXPIRES_IN') },
    );
  }
}
