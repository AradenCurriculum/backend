import { access, mkdir, writeFile } from 'fs/promises';
import { PrismaClient } from '@prisma/client';
import { Inject, Injectable } from '@nestjs/common';

import { CreateFileDto } from './dto/create-file.dto';
import { UploadChunkDto } from './dto/upload-chunk.dto';
import { FetchFilesDto } from './dto/fetch-files.dto';

@Injectable()
export class FileService {
  @Inject('PrismaClient') private prisma: PrismaClient;

  async createFile(userId: string, createFileDto: CreateFileDto) {
    const file = await this.prisma.file.upsert({
      where: { sign: createFileDto.sign },
      create: {
        userId,
        ...createFileDto,
      },
      update: {},
      select: {
        id: true,
        sign: true,
        type: true,
        size: true,
        uploadSize: true,
      },
    });

    try {
      await access(`assets/${userId}/${file.sign}`);
    } catch (err) {
      await mkdir(`assets/${userId}/${file.sign}`);
    }

    return file;
  }

  async uploadChunk(
    chunk: Express.Multer.File,
    uploadChunkDto: UploadChunkDto,
  ) {
    const existChunk = await this.prisma.chunk.findUnique({
      where: {
        md5: uploadChunkDto.md5,
      },
    });

    if (existChunk) {
      return existChunk;
    }

    const file = await this.prisma.file.findUnique({
      where: {
        id: uploadChunkDto.fileId,
      },
    });

    const path = `assets/${file.userId}/${file.sign}/${uploadChunkDto.md5}`;

    await writeFile(path, chunk.buffer, { flag: 'a' });

    const uploadedChunk = await this.prisma.chunk.create({
      data: uploadChunkDto,
    });

    const updatedFile = await this.prisma.file.update({
      where: {
        id: uploadChunkDto.fileId,
      },
      data: {
        uploadSize: {
          increment: uploadedChunk.size,
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

    return updatedFile;
  }

  async downloadFile(id: string) {
    return this.prisma.file.findUnique({
      where: { id },
      include: {
        chunks: true,
      },
    });
  }

  async getChunkPath(md5: string) {
    const chunk = await this.prisma.chunk.findUnique({
      where: { md5 },
      include: {
        file: {
          select: {
            userId: true,
            sign: true,
          },
        },
      },
    });
    return `assets/${chunk.file.userId}/${chunk.file.sign}/${md5}`;
  }

  filesList(userId: string, fetchFilesDto: FetchFilesDto) {
    if (!['updatedAt', 'name', 'size'].includes(fetchFilesDto.sortBy)) {
      fetchFilesDto.sortBy = 'updatedAt';
    }
    if (!['asc', 'desc'].includes(fetchFilesDto.orderBy)) {
      fetchFilesDto.orderBy = 'asc';
    }
    return this.prisma.file.findMany({
      where: { userId, path: fetchFilesDto.path },
      orderBy: {
        [fetchFilesDto.sortBy]: fetchFilesDto.orderBy,
      },
    });
  }
}
