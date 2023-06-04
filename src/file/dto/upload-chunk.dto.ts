import { Chunk } from '@prisma/client';
import { IsInt, IsString } from 'class-validator';

export class UploadChunkDto implements Partial<Chunk> {
  @IsString()
  md5: string;

  @IsInt()
  order: number;

  @IsInt()
  size: number;

  @IsString()
  fileId: string;
}
