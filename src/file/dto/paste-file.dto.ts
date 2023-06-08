import { IsArray, IsString } from 'class-validator';

export class PasteFileDto {
  @IsArray()
  fileId: string[];

  @IsString()
  newPath: string;
}
