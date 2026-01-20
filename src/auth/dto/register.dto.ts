import {
  IsEmail,
  IsJWT,
  IsNumberString,
  IsString,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';

import { PASSWORD_REGEX } from 'src/utils/regex';

export class RequestOtpDto {
  @IsEmail()
  email: string;
}

export class VerifyOtpDto {
  @IsEmail()
  email: string;

  @IsNumberString()
  @Length(4, 4)
  code: string;
}

export class RegisterDto {
  @IsJWT()
  registrationToken: string;

  @IsString()
  @MaxLength(100)
  name: string;

  @IsString()
  @Matches(PASSWORD_REGEX)
  password: string;

  @IsNumberString()
  @MaxLength(15)
  phone: string;
}
