import {
  BadRequestException,
  ConflictException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { ILike, Repository } from 'typeorm';

import { Category } from './entities/category.entity';

import { createApiResponse } from 'src/utils/response';
import { calculateOffset, calculatePaginationMeta } from 'src/utils/pagination';

import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async create(dto: CreateCategoryDto) {
    try {
      return await this.categoryRepository.save(dto);
    } catch (error) {
      // Postgres unique violation error code
      if (error.code === '23505') {
        throw new ConflictException(
          createApiResponse(
            HttpStatus.CONFLICT,
            false,
            'Category with this name already exists!',
          ),
        );
      }

      throw error;
    }
  }

  async findAll(page: number, size: number, keyword?: string, hard?: boolean) {
    const offset = calculateOffset(page, size);

    const [categories, count] = await this.categoryRepository.findAndCount({
      ...(keyword && {
        where: { name: ILike(`%${keyword}%`) },
      }),
      ...(hard && {
        withDeleted: true,
      }),
      skip: offset,
      take: size,
    });
    const meta = calculatePaginationMeta(count, page, size);

    return { categories, meta };
  }

  async findOne(id: string) {
    const category = await this.categoryRepository.findOne({
      where: { id },
    });

    if (!category) {
      throw new BadRequestException(
        createApiResponse(HttpStatus.NOT_FOUND, false, 'Category not found!'),
      );
    }

    return category;
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    const category = await this.categoryRepository.findOne({
      where: { id },
    });

    if (!category) {
      throw new BadRequestException(
        createApiResponse(HttpStatus.NOT_FOUND, false, 'Category not found!'),
      );
    }

    this.categoryRepository.merge(category, updateCategoryDto);

    try {
      return await this.categoryRepository.save(category);
    } catch (error) {
      if (error.code === '23505') {
        throw new ConflictException(
          createApiResponse(
            HttpStatus.CONFLICT,
            false,
            'Category with this name already exists!',
          ),
        );
      }

      throw error;
    }
  }

  async restore(id: string) {
    const category = await this.categoryRepository.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!category) {
      throw new BadRequestException(
        createApiResponse(HttpStatus.NOT_FOUND, false, 'Category not found!'),
      );
    }
    if (!category.deletedAt) {
      throw new BadRequestException(
        createApiResponse(
          HttpStatus.BAD_REQUEST,
          false,
          'Category is not deleted!',
        ),
      );
    }

    return await this.categoryRepository.restore(id);
  }

  async delete(id: string) {
    const category = await this.categoryRepository.findOne({
      where: { id },
    });

    if (!category) {
      throw new BadRequestException(
        createApiResponse(HttpStatus.NOT_FOUND, false, 'Category not found!'),
      );
    }

    return await this.categoryRepository.softDelete(id);
  }

  async destroy(id: string) {
    const category = await this.categoryRepository.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!category) {
      throw new BadRequestException(
        createApiResponse(HttpStatus.NOT_FOUND, false, 'Category not found!'),
      );
    }

    return await this.categoryRepository.delete(id);
  }
}
