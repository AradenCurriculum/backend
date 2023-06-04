import { File } from '@prisma/client';
import { IsInt, IsString } from 'class-validator';

export class CreateFileDto implements Partial<File> {
  @IsString()
  name: string;

  @IsString()
  path: string;

  @IsInt()
  size: number;

  @IsString()
  sign: string;

  @IsString()
  type: string;
}
