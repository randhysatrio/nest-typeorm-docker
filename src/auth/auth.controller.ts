import {
  Controller,
  Get,
  Post,
  Body,
  Delete,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';

import { AuthService } from './auth.service';

import { LocalAuthGuard } from 'src/guards/local.guard';
import { JwtAuthGuard } from 'src/guards/jwt.guard';

import { CurrentUser, CurrUser } from 'src/decorators/user.decorator';

import { createApiResponse } from 'src/utils/response';

import { RegisterDto, RequestOtpDto, VerifyOtpDto } from './dto/register.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('/login')
  async login(@CurrentUser() user: CurrUser) {
    const result = await this.authService.login(user);

    return createApiResponse(HttpStatus.OK, true, 'Login Successful', result);
  }

  @UseGuards(JwtAuthGuard)
  @Get('/logged-in')
  async loggedIn(@CurrentUser() user: CurrUser) {
    return createApiResponse(HttpStatus.OK, true, 'Logged-In Successful', user);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('/logout')
  async logout(@CurrentUser() user: CurrUser) {
    await this.authService.logout(user);

    return createApiResponse(HttpStatus.OK, true, 'Logout Successful');
  }

  @HttpCode(HttpStatus.OK)
  @Post('/request-otp')
  async requestOtp(@Body() payload: RequestOtpDto) {
    await this.authService.requestRegistrationOtp(payload.email);

    return createApiResponse(
      HttpStatus.OK,
      true,
      'OTP has been sent to your email',
    );
  }

  @HttpCode(HttpStatus.OK)
  @Post('/verify-otp')
  async verifyOtp(@Body() payload: VerifyOtpDto) {
    const result = await this.authService.verifyRegistrationOtp(
      payload.email,
      payload.code,
    );

    return createApiResponse(
      HttpStatus.OK,
      true,
      'OTP Verification Successful!',
      result,
    );
  }

  @Post('/register')
  async register(@Body() payload: RegisterDto) {
    const result = await this.authService.register(
      payload.registrationToken,
      payload.name,
      payload.password,
      payload.phone,
    );

    return createApiResponse(
      HttpStatus.CREATED,
      true,
      'Registration Successful!',
      result,
    );
  }
}
