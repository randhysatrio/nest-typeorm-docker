import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';

import { AppModule } from './app.module';

import { initializeDatabase } from 'data-source.config';

import { GlobalExceptionFiler } from './exceptions/global-exception.filter';

async function bootstrap() {
  await initializeDatabase();

  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(new GlobalExceptionFiler(app.get(HttpAdapterHost)));
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
