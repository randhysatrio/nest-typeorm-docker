import { Test } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { JwtService } from '@nestjs/jwt';

import { AuthModule } from '../auth.module';
import { UsersModule } from 'src/users/users.module';

import { AuthService } from '../auth.service';
import { AccessTokenService } from '../services/access-token.service';
import { SessionService } from '../services/session.service';
import { UserService } from '../services/user.service';

import { TestDatabaseModule } from 'test/fixtures/test-db.module';

describe('Auth login flow (integration)', () => {
  let authService: AuthService;
  let userService: UserService;
  let sessionService: SessionService;
  let accessTokenService: AccessTokenService;

  const email = 'test@mail.com';
  const password = 'hashed-password';

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
          load: [
            () => ({
              JWT_SECRET: 'test-secret',
            }),
          ],
        }),
        TestDatabaseModule,
        CacheModule.register({ isGlobal: true }),
        AuthModule,
        UsersModule,
      ],
    })
      .overrideProvider(JwtService)
      .useValue({
        sign: jest.fn().mockReturnValue('access-token'),
      })
      .compile();

    authService = module.get(AuthService);
    userService = module.get(UserService);
    sessionService = module.get(SessionService);
    accessTokenService = module.get(AccessTokenService);
  });

  it('should login user and create session', async () => {
    // Create mock user
    const user = await userService.create({
      name: 'Test',
      email,
      phone: '08123456789',
      password,
    });

    // Test login function
    const result = await authService.login({
      id: user.id,
      email: user.email,
    });

    // Assert result
    expect(result).toEqual({
      accessToken: 'access-token',
    });
  });
});
