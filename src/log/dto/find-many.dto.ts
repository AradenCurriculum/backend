import { IsString, IsNumber, IsOptional, IsArray } from 'class-validator';

export class FindManyDto {
  @IsNumber()
  current: number;

  @IsNumber()
  pageSize: number;

  @IsString()
  @IsOptional()
  keyword: string;

  @IsArray()
  @IsOptional()
  sizeRange: [number, number];

  @IsArray()
  @IsOptional()
  createdTime: [string, string];
}
