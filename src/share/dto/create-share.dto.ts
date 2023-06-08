import { IsArray, IsOptional, IsString } from 'class-validator';

export class CreateShareDto {
  @IsArray()
  files: string[];

  @IsString()
  @IsOptional()
  code?: string;

  @IsString()
  @IsOptional()
  overTime?: string | Date;

  @IsArray()
  receivers: string[];
}
