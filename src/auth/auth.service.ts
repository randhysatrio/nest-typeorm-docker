import { Injectable } from '@nestjs/common';

import { OtpService } from './services/otp.service';
import { RegistrationTokenService } from './services/registration-token.service';
import { AccessTokenService } from './services/access-token.service';
import { SessionService } from './services/session.service';
import { UserService } from './services/user.service';

import { CurrUser } from 'src/decorators/user.decorator';

@Injectable()
export class AuthService {
  constructor(
    private readonly otpService: OtpService,
    private readonly registrationTokenService: RegistrationTokenService,
    private readonly accessTokenService: AccessTokenService,
    private readonly sessionService: SessionService,
    private readonly userService: UserService,
  ) {}

  // ================== PASSPORT VALIDATIONS ==================
  async validatePassword(email: string, password: string) {
    const result = await this.userService.validatePassword(email, password);

    return result;
  }

  async validateSession(sub: string) {
    const session = await this.sessionService.validateSession(sub);

    return session;
  }

  // ================== LOGIN FLOW ==================
  async login(user: CurrUser) {
    await this.sessionService.create(user);

    return {
      accessToken: this.accessTokenService.create(user),
    };
  }

  async logout(user: CurrUser) {
    await this.sessionService.destroy(user.id);
  }

  // ================== REGISTRATION FLOW ==================
  async requestRegistrationOtp(email: string) {
    await this.userService.assertEmailExist(email);

    const otp = await this.otpService.issue(email);

    // In real application, send the OTP via email/SMS here. For this example, we are using email field and just logging it.
    // Never send OTP in response!
    console.log(`OTP for ${email}: ${otp}`);
  }

  async verifyRegistrationOtp(email: string, code: string) {
    await this.otpService.verify(email, code);

    const registrationToken = await this.registrationTokenService.issue(email);

    return { registrationToken };
  }

  async register(
    registrationToken: string,
    name: string,
    password: string,
    phone: string,
  ) {
    const email =
      await this.registrationTokenService.consume(registrationToken);

    await this.userService.assertPhoneExist(phone);

    const createdUser = await this.userService.create({
      name,
      email,
      password,
      phone,
    });

    const authData = {
      id: createdUser.id,
      email: createdUser.email,
    };

    await this.sessionService.create(authData);

    const accessToken = this.accessTokenService.create(authData);

    return { accessToken };
  }
}
