import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

import { initializeDatabase } from 'data-source.config';

async function bootstrap() {
  await initializeDatabase();

  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
