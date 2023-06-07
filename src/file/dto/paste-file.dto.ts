import { IsArray, IsOptional, IsString } from 'class-validator';

export class PasteFileDto {
  @IsArray()
  fileId: string[];

  @IsString()
  newPath: string;

  @IsString()
  @IsOptional()
  userId?: string;
}
