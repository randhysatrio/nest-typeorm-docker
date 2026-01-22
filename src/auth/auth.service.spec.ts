import { Test } from '@nestjs/testing';

import { AuthService } from './auth.service';

import { UserService } from './services/user.service';
import { OtpService } from './services/otp.service';
import { RegistrationTokenService } from './services/registration-token.service';
import { SessionService } from './services/session.service';
import { AccessTokenService } from './services/access-token.service';

describe('AuthService', () => {
  let service: AuthService;

  let otpService: jest.Mocked<OtpService>;
  let registrationTokenService: jest.Mocked<RegistrationTokenService>;
  let accessTokenService: jest.Mocked<AccessTokenService>;
  let sessionService: jest.Mocked<SessionService>;
  let userService: jest.Mocked<UserService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: OtpService, useValue: mockOtpService() },
        {
          provide: RegistrationTokenService,
          useValue: mockRegistrationTokenService(),
        },
        { provide: AccessTokenService, useValue: mockAccessTokenService() },
        { provide: SessionService, useValue: mockSessionService() },
        { provide: UserService, useValue: mockUserService() },
      ],
    }).compile();

    service = module.get(AuthService);
    otpService = module.get(OtpService);
    registrationTokenService = module.get(RegistrationTokenService);
    accessTokenService = module.get(AccessTokenService);
    sessionService = module.get(SessionService);
    userService = module.get(UserService);
  });

  const id = 'abcd-1234';
  const email = 'test@mail.com';
  const token = 'eyJhAccessToken';
  const regisToken = 'eyJhRegisToken';
  const otpCode = '1234';

  it('should create session and return token on Login', async () => {
    accessTokenService.create.mockReturnValue(token);

    const user = { id, email };

    const result = await service.login(user);

    expect(sessionService.create).toHaveBeenCalledWith(user);

    expect(accessTokenService.create).toHaveBeenCalledWith(user);

    expect(result).toEqual({ accessToken: token });
  });

  it('should destroy session on Logout', async () => {
    const user = { id, email };

    await service.logout(user);

    expect(sessionService.destroy).toHaveBeenCalledWith(id);
  });

  it('should return OTP code for initiating registration', async () => {
    otpService.issue.mockResolvedValue(otpCode);

    await service.requestRegistrationOtp(email);

    expect(userService.assertEmailExist).toHaveBeenCalledWith(email);

    expect(otpService.issue).toHaveBeenLastCalledWith(email);
  });

  it('should consume OTP code and return RegistrationToken', async () => {
    registrationTokenService.issue.mockResolvedValue(regisToken);

    const result = await service.verifyRegistrationOtp(email, otpCode);

    expect(otpService.verify).toHaveBeenCalledWith(email, otpCode);

    expect(registrationTokenService.issue).toHaveBeenCalledWith(email);

    expect(result).toEqual({ registrationToken: regisToken });
  });

  it('should register a User using RegistrationToken', async () => {
    const name = 'Test User';
    const phone = '0812111222333';
    const password = 'supeRSecr3t!';

    registrationTokenService.consume.mockResolvedValue(email);
    userService.create.mockResolvedValue({
      id,
      email,
    } as any);
    accessTokenService.create.mockReturnValue(token);

    const result = await service.register(regisToken, name, password, phone);

    expect(registrationTokenService.consume).toHaveBeenCalledWith(regisToken);

    expect(userService.assertPhoneExist).toHaveBeenCalledWith(phone);

    expect(userService.create).toHaveBeenLastCalledWith({
      email,
      password,
      name,
      phone,
    });

    expect(sessionService.create).toHaveBeenCalledWith({
      id,
      email,
    });

    expect(result).toEqual({ accessToken: token });
  });
});

const mockOtpService = () => ({
  issue: jest.fn(),
  verify: jest.fn(),
});

const mockRegistrationTokenService = () => ({
  issue: jest.fn(),
  consume: jest.fn(),
});

const mockAccessTokenService = () => ({
  create: jest.fn(),
});

const mockSessionService = () => ({
  create: jest.fn(),
  destroy: jest.fn(),
  validateSession: jest.fn(),
});

const mockUserService = () => ({
  assertEmailExist: jest.fn(),
  assertPhoneExist: jest.fn(),
  create: jest.fn(),
  validatePassword: jest.fn(),
});
