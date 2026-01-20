import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
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

import { CreateAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';

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
}
