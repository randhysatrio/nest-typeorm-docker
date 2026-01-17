import { ConfigService } from '@nestjs/config';

import { config } from 'dotenv';
import { DataSource, DataSourceOptions } from 'typeorm';

config();

const configService = new ConfigService();

export const AppDataSourceConfig: DataSourceOptions = {
  // @ts-expect-error
  type: configService.getOrThrow<string>('DB_TYPE'),
  host: configService.getOrThrow<string>('DB_HOST'),
  port: configService.getOrThrow<number>('DB_PORT'),
  username: configService.getOrThrow<string>('DB_USER'),
  password: configService.getOrThrow<string>('DB_PASSWORD'),
  database: configService.getOrThrow<string>('DB_NAME'),
  entities: ['dist/**/*.entity{.ts,.js}'],
  migrations: ['dist/migrations/**/*{.ts,.js}'],
  migrationsTableName: 'migrations',
  synchronize: false,
  autoLoadEntities: true,
};

const AppDataSource = new DataSource(AppDataSourceConfig);

AppDataSource.initialize();

export default AppDataSource;
