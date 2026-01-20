import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';

import KeyvRedis from '@keyv/redis';

import { AppDataSourceConfig } from '../data-source.config';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { CategoriesModule } from './categories/categories.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot(AppDataSourceConfig),
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async (configService: ConfigService) => ({
        stores: [new KeyvRedis(configService.getOrThrow('REDIS_URL'))],
      }),
      inject: [ConfigService],
    }),
    CategoriesModule,
    UsersModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
