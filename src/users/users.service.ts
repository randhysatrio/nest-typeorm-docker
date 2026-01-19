import {
  BadRequestException,
  ConflictException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { ILike, Repository } from 'typeorm';

import { createApiResponse } from 'src/utils/response';
import { calculateOffset, calculatePaginationMeta } from 'src/utils/pagination';

import { User } from './entities/user.entity';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto) {
    try {
      return await this.userRepository.save(
        this.userRepository.merge(new User(), {
          ...createUserDto,
          isVerified: true,
        }),
      );
    } catch (error) {
      if (error.code === '23505') {
        throw new ConflictException(
          createApiResponse(
            HttpStatus.CONFLICT,
            false,
            'User with this email or phone already exists!',
          ),
        );
      }

      throw error;
    }
  }

  async findAll(page: number, size: number, keyword?: string, hard?: boolean) {
    const offset = calculateOffset(page, size);

    const [data, count] = await this.userRepository.findAndCount({
      ...(keyword && {
        where: [
          { name: ILike(`%${keyword}%`) },
          { email: ILike(`%${keyword}%`) },
          { phone: ILike(`%${keyword}%`) },
        ],
      }),
      ...(hard && { withDeleted: true }),
      skip: offset,
      take: size,
    });
    const meta = calculatePaginationMeta(count, page, size);

    return { data, meta };
  }

  async findOne(id: string) {
    const user = await this.userRepository.findOneBy({ id });

    if (!user) {
      throw new BadRequestException(
        createApiResponse(HttpStatus.BAD_REQUEST, false, 'User not found!'),
      );
    }

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.userRepository.findOneBy({ id });

    if (!user) {
      throw new BadRequestException(
        createApiResponse(HttpStatus.BAD_REQUEST, false, 'User not found!'),
      );
    }

    this.userRepository.merge(user, updateUserDto);

    try {
      return await this.userRepository.save(user);
    } catch (error) {
      if (error.code === '23505') {
        throw new ConflictException(
          createApiResponse(
            HttpStatus.CONFLICT,
            false,
            'User with this email or phone already exists!',
          ),
        );
      }

      throw error;
    }
  }

  async delete(id: string) {
    const user = await this.userRepository.findOneBy({ id });

    if (!user) {
      throw new BadRequestException(
        createApiResponse(HttpStatus.BAD_REQUEST, false, 'User not found!'),
      );
    }

    return await this.userRepository.softDelete(id);
  }

  async destroy(id: string) {
    const user = await this.userRepository.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!user) {
      throw new BadRequestException(
        createApiResponse(HttpStatus.NOT_FOUND, false, 'User not found!'),
      );
    }
    if (!user.deletedAt) {
      throw new BadRequestException(
        createApiResponse(
          HttpStatus.BAD_REQUEST,
          false,
          'User must be deleted before destroyed!',
        ),
      );
    }

    return await this.userRepository.delete(id);
  }
}
