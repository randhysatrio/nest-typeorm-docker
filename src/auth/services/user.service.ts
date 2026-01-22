import {
  ConflictException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';

import { User } from 'src/users/entities/user.entity';

import { createApiResponse } from 'src/utils/response';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
  ) {}

  async assertEmailExist(email: string) {
    const emailExist = await this.repo.findOne({
      where: { email },
      select: ['id', 'email'],
    });

    if (emailExist) {
      throw new ConflictException(
        createApiResponse(
          HttpStatus.CONFLICT,
          false,
          'Email Already Registered',
        ),
      );
    }
  }

  async assertPhoneExist(phone: string) {
    const phoneExist = await this.repo.findOne({
      where: { phone },
      select: ['id', 'phone'],
    });

    if (phoneExist) {
      throw new ConflictException(
        createApiResponse(
          HttpStatus.CONFLICT,
          false,
          'Phone Already Registered',
        ),
      );
    }
  }

  async create(data: {
    name: string;
    email: string;
    password: string;
    phone: string;
  }) {
    const user = this.repo.create({
      ...data,
      isVerified: true,
    });

    return await this.repo.save(user);
  }

  async validatePassword(email: string, password: string) {
    const user = await this.repo.findOne({
      where: { email },
      select: ['id', 'email', 'password'],
    });

    if (!user || !user.password) {
      throw new UnauthorizedException(
        createApiResponse(
          HttpStatus.UNAUTHORIZED,
          false,
          'Invalid Credentials',
        ),
      );
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new UnauthorizedException(
        createApiResponse(
          HttpStatus.UNAUTHORIZED,
          false,
          'Invalid Credentials',
        ),
      );
    }

    const { password: _, ...cleanedUser } = user;

    return cleanedUser;
  }
}
