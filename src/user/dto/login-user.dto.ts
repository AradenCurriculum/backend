import { User } from '@prisma/client';
import { IsString } from 'class-validator';

export class LoginUserDto implements Partial<User> {
  @IsString()
  username: string;

  @IsString()
  password: string;
}
