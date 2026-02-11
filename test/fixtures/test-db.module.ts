import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from 'src/users/entities/user.entity';

export const TestDatabaseModule = TypeOrmModule.forRoot({
  type: 'sqlite',
  database: ':memory:',
  dropSchema: true,
  entities: [User],
  synchronize: true,
  logging: false,
});
