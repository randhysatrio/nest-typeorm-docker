import { IsEmail, IsString, Matches, MaxLength } from 'class-validator';

import { PASSWORD_REGEX } from 'src/utils/regex';

export class CreateUserDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsString()
  @IsEmail()
  email: string;

  @IsString()
  @Matches(PASSWORD_REGEX)
  password: string;

  @IsString()
  @MaxLength(20)
  phone: string;
}
