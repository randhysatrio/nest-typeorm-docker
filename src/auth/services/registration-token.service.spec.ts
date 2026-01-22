import { Test } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { JwtService } from '@nestjs/jwt';

import { RegistrationTokenService } from './registration-token.service';

describe('RegistrationTokenService', () => {
  let service: RegistrationTokenService;
  let config: jest.Mocked<ConfigService>;
  let jwt: jest.Mocked<JwtService>;
  let cache: jest.Mocked<{
    get: (key: string) => Promise<any>;
    set: (key: string, value: any, ttl?: number) => Promise<void>;
    del: (key: string) => Promise<void>;
  }>;

  beforeEach(async () => {
    cache = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        RegistrationTokenService,
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            verify: jest.fn(),
          },
        },
        {
          provide: CACHE_MANAGER,
          useValue: cache,
        },
      ],
    }).compile();

    service = module.get(RegistrationTokenService);
    jwt = module.get(JwtService);
    config = module.get(ConfigService);
  });

  const jti = '12345';
  const email = 'test@mail.com';
  const jwtToken = 'eyJhbGciOiJIUz';

  it('should issue a RegistrationToken and store Session', async () => {
    config.getOrThrow.mockReturnValue('1000');
    jwt.sign.mockReturnValue(jwtToken);

    const token = await service.issue(email);

    expect(token).toEqual(jwtToken);

    expect(cache.set).toHaveBeenCalledTimes(1);

    const [key, value, ttl] = cache.set.mock.calls[0];

    expect(key).toMatch(/^Auth:Registration:/);
    expect(value).toEqual(email);
    expect(ttl).toEqual(1000);

    expect(jwt.sign).toHaveBeenCalledWith(
      expect.objectContaining({
        jti: expect.any(String),
        email,
        scope: 'registration',
      }),
      expect.any(Object),
    );
  });

  it('should consume a valid RegistrationToken', async () => {
    jwt.verify.mockReturnValue({
      jti,
      email,
      scope: 'registration',
    });

    cache.get.mockResolvedValue(email);

    const emailResult = await service.consume(jwtToken);

    expect(emailResult).toEqual(email);

    expect(jwt.verify).toHaveBeenCalledWith(jwtToken, expect.any(Object));

    expect(cache.get).toHaveBeenCalledWith(`Auth:Registration:${jti}`);

    expect(cache.del).toHaveBeenCalledWith(`Auth:Registration:${jti}`);
  });

  it('should throw an error if RegistrationToken malformed', async () => {
    jwt.verify.mockReturnValue(() => {
      throw new UnauthorizedException();
    });

    await expect(service.consume('bad-token :(')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it(`should throw an error if scope is not 'registration'`, async () => {
    jwt.verify.mockReturnValue({
      jti,
      email,
      scope: 'forget-password',
    });

    await expect(service.consume(jwtToken)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('should throw an error if RegistrationSession not found', async () => {
    jwt.verify.mockReturnValue({
      jti,
      email,
      scope: 'registration',
    });

    cache.get.mockResolvedValue(undefined);

    await expect(service.consume(jwtToken)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );

    expect(cache.get).toHaveBeenCalledWith(`Auth:Registration:${jti}`);
  });

  it('should throw an error if Email in RegistrationSession is different', async () => {
    jwt.verify.mockReturnValue({
      jti,
      email,
      scope: 'registration',
    });

    cache.get.mockResolvedValue('not-test@mail.com');

    await expect(service.consume(jwtToken)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );

    expect(cache.get).toHaveBeenCalledWith(`Auth:Registration:${jti}`);

    expect(cache.del).not.toHaveBeenCalled();
  });
});
