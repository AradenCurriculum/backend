import { IsOptional, IsString } from 'class-validator';

export class FetchFilesDto {
  @IsString()
  @IsOptional()
  keyword?: string;

  @IsString()
  path: string;

  @IsString()
  sortBy?: string;

  @IsString()
  orderBy?: string;
}
