import {
  ConflictException,
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

  // ================== AUTH HELPERS ==================
  private makeAuthOtpKey(email: string) {
    return `Auth:Otp:${email}`;
  }

  private makeAuthRegistrationKey(jti: string) {
    return `Auth:Registration:${jti}`;
  }

  private makeAuthSessionKey(userId: string) {
    return `Auth:Session:${userId}`;
  }

  private makeOtpCode() {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }

  private generateRegistrationToken(jti: string, email: string) {
    return this.jwtService.sign(
      { jti, email },
      {
        secret: this.configService.getOrThrow('REGISTRATION_TOKEN_SECRET'),
        expiresIn: this.configService.getOrThrow(
          'REGISTRATION_TOKEN_EXPIRES_IN',
        ),
      },
    );
  }

  private async verifyRegistrationToken(token: string) {
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.getOrThrow('REGISTRATION_TOKEN_SECRET'),
      });

      return payload as { jti: string; email: string };
    } catch (error) {
      throw new UnauthorizedException(
        createApiResponse(
          HttpStatus.UNAUTHORIZED,
          false,
          'Invalid Registration Token',
        ),
      );
    }
  }

  private async verifyRegistrationSession(
    registrationKey: string,
    email: string,
  ) {
    const registrationEmail = await this.cacheManager.get(registrationKey);

    if (!registrationEmail || registrationEmail !== email) {
      throw new UnauthorizedException(
        createApiResponse(
          HttpStatus.UNAUTHORIZED,
          false,
          'Invalid or Expired Registration Token',
        ),
      );
    }
  }

  private async createUserSession(user: CurrUser) {
    const key = this.makeAuthSessionKey(user.id);

    await this.cacheManager.set(
      key,
      user,
      +this.configService.getOrThrow('SESSION_EXPIRES_IN'), // in milliseconds
    );
  }

  private generateAccessToken(userId: string) {
    return this.jwtService.sign(
      { sub: userId },
      { expiresIn: this.configService.getOrThrow('JWT_EXPIRES_IN') },
    );
  }

  // ================== PASSPORT VALIDATIONS ==================
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

  // ================== LOGIN FLOW ==================
  async login(user: CurrUser) {
    await this.createUserSession(user);

    return {
      accessToken: this.generateAccessToken(user.id),
    };
  }

  async logout(user: CurrUser) {
    const key = this.makeAuthSessionKey(user.id);
    await this.cacheManager.del(key);
  }

  // ================== REGISTRATION FLOW ==================
  async requestRegistrationOtp(email: string) {
    const emailExists = await this.userRepository.findOne({
      where: { email },
      select: ['id', 'email'],
    });

    if (emailExists) {
      throw new ConflictException(
        createApiResponse(
          HttpStatus.CONFLICT,
          false,
          'Email Already Registered',
        ),
      );
    }

    const key = this.makeAuthOtpKey(email);
    const otp = this.makeOtpCode();

    await this.cacheManager.set(
      key,
      otp,
      +this.configService.getOrThrow('OTP_EXPIRES_IN'), // in milliseconds
    );

    // In real application, send the OTP via email/SMS here. For this example, we are using email and just logging it.
    // Never send OTP in response!.
    console.log(`OTP for ${email}: ${otp}`);
  }

  async verifyRegistrationOtp(email: string, code: string) {
    const key = this.makeAuthOtpKey(email);
    const storedOtp = await this.cacheManager.get<string>(key);

    if (storedOtp !== code) {
      throw new UnauthorizedException(
        createApiResponse(HttpStatus.UNAUTHORIZED, false, 'Invalid OTP Code'),
      );
    }

    await this.cacheManager.del(key);

    const jti = crypto.randomUUID();

    const registrationKey = this.makeAuthRegistrationKey(jti);
    await this.cacheManager.set(
      registrationKey,
      email,
      +this.configService.getOrThrow('REGISTRATION_SESSION_EXPIRES_IN'),
    );

    const registrationToken = this.generateRegistrationToken(jti, email);

    return { registrationToken };
  }

  async register(
    registrationToken: string,
    name: string,
    password: string,
    phone: string,
  ) {
    const { jti, email } =
      await this.verifyRegistrationToken(registrationToken);

    const registrationKey = this.makeAuthRegistrationKey(jti);

    await this.verifyRegistrationSession(registrationKey, email);

    await this.cacheManager.del(registrationKey);

    const existingPhone = await this.userRepository.findOne({
      where: { phone },
      select: ['id', 'phone'],
    });
    if (existingPhone) {
      throw new ConflictException(
        createApiResponse(
          HttpStatus.CONFLICT,
          false,
          'Phone Number Already Registered',
        ),
      );
    }

    const newUser = this.userRepository.create({
      name,
      email,
      password,
      phone,
      isVerified: true,
    });
    const createdUser = await this.userRepository.save(newUser);

    const accessToken = this.generateAccessToken(createdUser.id);

    await this.createUserSession({
      id: createdUser.id,
      email: createdUser.email,
    });

    return { accessToken };
  }
}
