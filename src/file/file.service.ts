import { writeFile } from 'fs/promises';
import { PrismaClient } from '@prisma/client';
import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';

import { CreateFileDto } from './dto/create-file.dto';
import { UploadChunkDto } from './dto/upload-chunk.dto';

@Injectable()
export class FileService {
  @Inject('PrismaClient') private prisma: PrismaClient;

  createFile(userId: string, createFileDto: CreateFileDto) {
    return this.prisma.file.create({
      data: {
        userId,
        ...createFileDto,
      },
      select: {
        id: true,
        sign: true,
        type: true,
        size: true,
        uploadSize: true,
      },
    });
  }

  async uploadChunk(
    userId: string,
    chunk: Express.Multer.File,
    uploadChunkDto: UploadChunkDto,
  ) {
    await writeFile(`assets/${userId}/${uploadChunkDto.md5}`, chunk.buffer, {
      flag: 'a',
    });

    const res = await this.prisma.chunk.create({
      data: {
        ...uploadChunkDto,
      },
    });
    if (!res) {
      throw new HttpException('Could not upload', HttpStatus.BAD_GATEWAY);
    }
    const file = await this.prisma.file.update({
      where: {
        id: uploadChunkDto.fileId,
      },
      data: {
        uploadSize: {
          increment: res.size,
        },
      },
      select: {
        id: true,
        sign: true,
        type: true,
        size: true,
        uploadSize: true,
      },
    });

    return file;
  }

  async downloadFile(id: string) {
    return this.prisma.file.findUnique({
      where: { id },
      include: {
        chunks: true,
      },
    });
  }
}
