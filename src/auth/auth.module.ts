import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

import { UsersModule } from 'src/users/users.module';

import { OtpService } from './services/otp.service';
import { RegistrationTokenService } from './services/registration-token.service';
import { AccessTokenService } from './services/access-token.service';
import { SessionService } from './services/session.service';
import { UserService } from './services/user.service';

import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        global: true,
        secret: configService.getOrThrow('JWT_SECRET'),
      }),
      inject: [ConfigService],
    }),
    PassportModule,
    UsersModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    LocalStrategy,
    JwtStrategy,
    OtpService,
    RegistrationTokenService,
    AccessTokenService,
    SessionService,
    UserService,
  ],
})
export class AuthModule {}
