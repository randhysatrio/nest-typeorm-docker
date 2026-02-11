import { Test } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { JwtModule, JwtService } from '@nestjs/jwt';

import { TestDatabaseModule } from 'test/fixtures/test-db.module';

import { AuthModule } from '../auth.module';

import { AuthService } from '../auth.service';
import { OtpService } from '../services/otp.service';
import { UserService } from '../services/user.service';

describe('Auth register flow (Integration)', () => {
  let userService: UserService;

  let authService: AuthService;
  let otpService: OtpService;

  const name = 'Test Subject';
  const email = 'test@email.com';
  const phone = '0812345678';
  const password = 'supeRS3cret!';

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),
        TestDatabaseModule,
        JwtModule.register({ global: true }),
        CacheModule.register({ isGlobal: true }),
        AuthModule,
      ],
    }).compile();

    userService = module.get(UserService);
    authService = module.get(AuthService);
    otpService = module.get(OtpService);
  });

  it('should register a user and create a session', async () => {
    await authService.requestRegistrationOtp(email);

    const otpCode = await otpService.__getOtpForTest(email);

    const result = await authService.verifyRegistrationOtp(email, otpCode);

    expect(result).toHaveProperty('registrationToken');

    const { registrationToken } = result;

    const resultRegister = await authService.register(
      registrationToken,
      name,
      password,
      phone,
    );

    expect(resultRegister).toHaveProperty('accessToken');
  });
});
