import { Test } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

import { SessionService } from './session.service';

import { CurrUser } from 'src/decorators/user.decorator';

describe('SessionService', () => {
  let service: SessionService;
  let config: ConfigService;
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
        SessionService,
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn().mockReturnValue('1000'),
          },
        },
        {
          provide: CACHE_MANAGER,
          useValue: cache,
        },
      ],
    }).compile();

    service = module.get(SessionService);
    config = module.get(ConfigService);
  });

  const user: CurrUser = {
    id: 'abcd-1234',
    email: 'test@mail.com',
  };

  it('should create an Auth session', async () => {
    await service.create(user);

    expect(config.getOrThrow).toHaveBeenCalledWith('SESSION_EXPIRES_IN');

    expect(cache.set).toHaveBeenCalledWith(
      `Auth:Session:abcd-1234`,
      user,
      1000,
    );
  });

  it('should get an Auth session', async () => {
    cache.get.mockResolvedValue(user);

    const result = await service.get(user.id);

    expect(cache.get).toHaveBeenCalledWith(`Auth:Session:abcd-1234`);

    expect(result).toEqual(user);
  });

  it('should destroy Auth session', async () => {
    await service.destroy(user.id);

    expect(cache.del).toHaveBeenCalledWith('Auth:Session:abcd-1234');
  });

  it('should throws Unauthorized if no session found', async () => {
    cache.get.mockResolvedValue(undefined);

    await expect(service.validateSession(user.id)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
