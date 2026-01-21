import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

import { OtpService } from './otp.service';

describe('OtpService', () => {
  let service: OtpService;
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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OtpService,
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn(),
          },
        },
        {
          provide: CACHE_MANAGER,
          useValue: cache,
        },
      ],
    }).compile();

    service = module.get(OtpService);
    config = module.get(ConfigService);
  });

  it('should create and store OTP code', async () => {
    jest.spyOn(config, 'getOrThrow').mockReturnValue('300');

    const otp = await service.issue('test@mail.com');

    expect(cache.set).toHaveBeenCalledWith('Auth:Otp:test@mail.com', otp, 300);

    expect(otp).toHaveLength(4);
  });

  it('should verify and consume OTP', async () => {
    cache.get.mockResolvedValue('1234');

    await service.verify('test@email.com', '1234');

    expect(cache.del).toHaveBeenCalledWith('Auth:Otp:test@email.com');
  });

  it('should throws if OTP is different', async () => {
    cache.get.mockResolvedValue('0000');

    await expect(
      service.verify('test@email.com', '1111'),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(cache.del).not.toHaveBeenCalled();
  });

  it('should throws if OTP is missing or expired', async () => {
    cache.get.mockResolvedValue(undefined);

    await expect(
      service.verify('test@email.com', '1234'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
