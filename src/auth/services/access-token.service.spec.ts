import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

import { AccessTokenService } from './access-token.service';

import { CurrUser } from 'src/decorators/user.decorator';

describe('AccessTokenService', () => {
  let service: AccessTokenService;
  let jwtService: JwtService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccessTokenService,
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(AccessTokenService);
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);
  });

  it('should create access token with correct payload and expiration', () => {
    const user: CurrUser = {
      id: 'user-123',
      email: 'test@email.com',
    };

    jest.spyOn(configService, 'getOrThrow').mockReturnValue('15m');

    jest.spyOn(jwtService, 'sign').mockReturnValue('mock-access-token');

    const token = service.create(user);

    expect(configService.getOrThrow).toHaveBeenCalledWith('JWT_EXPIRES_IN');

    expect(jwtService.sign).toHaveBeenCalledWith(
      { sub: 'user-123', email: 'test@email.com' },
      { expiresIn: '15m' },
    );

    expect(token).toBe('mock-access-token');
  });
});
