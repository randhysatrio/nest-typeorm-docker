import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpStatus,
  Query,
  ParseIntPipe,
  ParseBoolPipe,
  Put,
} from '@nestjs/common';

import { CategoriesService } from './categories.service';

import { createApiResponse } from 'src/utils/response';

import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  async create(@Body() createCategoryDto: CreateCategoryDto) {
    const category = await this.categoriesService.create(createCategoryDto);

    return createApiResponse(
      HttpStatus.CREATED,
      true,
      'Category created successfully',
      category,
    );
  }

  @Get()
  async findAll(
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('size', ParseIntPipe) size: number = 10,
    @Query('keyword') keyword?: string,
    @Query('hard', new ParseBoolPipe({ optional: true })) hard?: boolean,
  ) {
    const { categories, meta } = await this.categoriesService.findAll(
      page ?? 1,
      size ?? 10,
      keyword,
      hard,
    );

    return createApiResponse(
      HttpStatus.OK,
      true,
      'Categories retrieved successfully',
      categories,
      meta,
    );
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const category = await this.categoriesService.findOne(id);

    return createApiResponse(
      HttpStatus.OK,
      true,
      'Category retrieved successfully',
      category,
    );
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    const updatedCategory = await this.categoriesService.update(
      id,
      updateCategoryDto,
    );

    return createApiResponse(
      HttpStatus.OK,
      true,
      'Category updated successfully',
      updatedCategory,
    );
  }

  @Put(':id')
  async restore(@Param('id') id: string) {
    await this.categoriesService.restore(id);

    return createApiResponse(
      HttpStatus.OK,
      true,
      'Category restored successfully',
    );
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    await this.categoriesService.delete(id);

    return createApiResponse(
      HttpStatus.OK,
      true,
      'Category deleted successfully',
    );
  }

  @Delete('destroy/:id')
  async destroy(@Param('id') id: string) {
    await this.categoriesService.destroy(id);

    return createApiResponse(
      HttpStatus.OK,
      true,
      'Category destroyed successfully',
    );
  }
}
