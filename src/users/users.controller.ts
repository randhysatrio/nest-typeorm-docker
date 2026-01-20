import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  ParseBoolPipe,
  HttpStatus,
  HttpCode,
  Query,
} from '@nestjs/common';

import { UsersService } from './users.service';

import { createApiResponse } from 'src/utils/response';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @HttpCode(HttpStatus.CREATED)
  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    const user = await this.usersService.create(createUserDto);

    return createApiResponse(
      HttpStatus.CREATED,
      true,
      'User created successfully!',
      user,
    );
  }

  @Get()
  async findAll(
    @Query('page', ParseIntPipe) page: number,
    @Query('size', ParseIntPipe) size: number,
    @Query('keyword') keyword?: string,
    @Query('hard', new ParseBoolPipe({ optional: true })) hard?: boolean,
  ) {
    const { data, meta } = await this.usersService.findAll(
      page,
      size,
      keyword,
      hard,
    );

    return createApiResponse(
      HttpStatus.OK,
      true,
      'Users retrieved successfully!',
      data,
      meta,
    );
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findOne(id);

    return createApiResponse(
      HttpStatus.OK,
      true,
      'User retrieved successfully!',
      user,
    );
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    await this.usersService.update(id, updateUserDto);

    return createApiResponse(HttpStatus.OK, true, 'User updated successfully!');
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    await this.usersService.delete(id);

    return createApiResponse(HttpStatus.OK, true, 'User deleted successfully!');
  }

  @Delete('destroy/:id')
  async destroy(@Param('id') id: string) {
    await this.usersService.destroy(id);

    return createApiResponse(
      HttpStatus.OK,
      true,
      'User destroyed successfully!',
    );
  }
}
