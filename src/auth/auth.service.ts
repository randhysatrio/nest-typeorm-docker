import {
  HttpStatus,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';

import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';

import { createApiResponse } from 'src/utils/response';

import { User } from 'src/users/entities/user.entity';

import { CurrUser } from 'src/decorators/user.decorator';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  private makeAuthSessionKey(userId: string) {
    return `Auth:Session:${userId}`;
  }

  private generateAccessToken(userId: string) {
    return this.jwtService.sign(
      { sub: userId },
      { expiresIn: this.configService.getOrThrow('JWT_EXPIRES_IN') },
    );
  }

  async validatePassword(email: string, password: string) {
    const user = await this.userRepository.findOne({
      where: { email },
      select: ['id', 'email', 'password'],
    });

    if (!user || !user.password) {
      throw new UnauthorizedException(
        createApiResponse(
          HttpStatus.UNAUTHORIZED,
          false,
          'Invalid Credentials',
        ),
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException(
        createApiResponse(
          HttpStatus.UNAUTHORIZED,
          false,
          'Invalid Credentials',
        ),
      );
    }

    const { password: _, ...result } = user;

    return result;
  }

  async validateSession(sub: string) {
    const key = this.makeAuthSessionKey(sub);
    const session = await this.cacheManager.get<CurrUser>(key);

    if (!session) {
      throw new UnauthorizedException(
        createApiResponse(HttpStatus.UNAUTHORIZED, false, 'Session Not Found'),
      );
    }

    return session;
  }

  async login(user: CurrUser) {
    const key = this.makeAuthSessionKey(user.id);

    await this.cacheManager.set(
      key,
      user,
      +this.configService.getOrThrow('SESSION_EXPIRES_IN'), // in milliseconds
    );

    return {
      accessToken: this.generateAccessToken(user.id),
    };
  }
}
