import { User } from '@prisma/client';
import {
  IsString,
  IsEmail,
  IsDate,
  MinLength,
  MaxLength,
  IsOptional,
} from 'class-validator';

export class UpdateUserDto implements Partial<User> {
  @IsString()
  @MinLength(6)
  @MaxLength(20)
  @IsOptional()
  username?: string;

  @IsString()
  @MinLength(6)
  @MaxLength(20)
  @IsOptional()
  password?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsDate()
  @IsOptional()
  loginTime?: Date;
}
