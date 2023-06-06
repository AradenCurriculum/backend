import { access, mkdir, writeFile } from 'fs/promises';
import { PrismaClient } from '@prisma/client';
import { Inject, Injectable } from '@nestjs/common';

import { CreateFileDto } from './dto/create-file.dto';
import { UploadChunkDto } from './dto/upload-chunk.dto';
import { FetchFilesDto } from './dto/fetch-files.dto';

@Injectable()
export class FileService {
  @Inject('PrismaClient') private prisma: PrismaClient;
  // fileId -> 实际存储路径的映射，避免每次获取文件块的下载路径时都查数据库
  private filePathRecord: Map<string, string> = new Map();

  // 创建文件记录，在实际存储路径位置创建用于存储文件块的文件夹
  async createFile(userId: string, createFileDto: CreateFileDto) {
    const file = await this.prisma.file.create({
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

    const realPath = `assets/${userId}/${file.sign}`;

    try {
      await access(realPath);
    } catch (err) {
      await mkdir(realPath);
    } finally {
      this.filePathRecord.set(file.id, realPath);
    }

    return file;
  }

  // 将文件块写入本地，创建文件块记录，更新文件记录
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

    let realPath = '';

    if (this.filePathRecord.has(uploadChunkDto.fileId)) {
      realPath = `${this.filePathRecord.get(uploadChunkDto.fileId)}`;
    } else {
      const file = await this.prisma.file.findUnique({
        where: {
          id: uploadChunkDto.fileId,
        },
      });
      realPath = `assets/${file.userId}/${file.sign}`;
      this.filePathRecord.set(uploadChunkDto.fileId, realPath);
    }

    await writeFile(`${realPath}/${uploadChunkDto.md5}`, chunk.buffer, {
      flag: 'a',
    });

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

  // 下载文件，不如说是获取文件信息
  async getFileInfo(id: string) {
    return this.prisma.file.findUnique({
      where: { id },
      include: {
        chunks: true,
      },
    });
  }

  // 获取文件块的实际存储路径
  async getChunkPath(id: string, md5: string) {
    let realPath = '';
    if (this.filePathRecord.has(id)) {
      realPath = `${this.filePathRecord.get(id)}`;
    } else {
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
      realPath = `assets/${chunk.file.userId}/${chunk.file.sign}`;
      this.filePathRecord.set(id, realPath);
    }
    return `${realPath}/${md5}`;
  }

  // 获取用户文件列表
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
