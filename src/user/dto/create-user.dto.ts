import { User } from '@prisma/client';
import { IsString, IsEmail, MinLength, MaxLength } from 'class-validator';

export class CreateUserDto implements Partial<User> {
  @IsString()
  inviteCode: string;

  @IsString()
  @MinLength(6)
  @MaxLength(20)
  username: string;

  @IsString()
  @MinLength(6)
  @MaxLength(20)
  password: string;

  @IsEmail()
  email: string;
}
