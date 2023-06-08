import { access, copyFile, mkdir, rmdir, unlink, writeFile } from 'fs/promises';
import { File, PrismaClient } from '@prisma/client';
import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';

import { CreateFileDto } from './dto/create-file.dto';
import { UploadChunkDto } from './dto/upload-chunk.dto';
import { FetchFilesDto } from './dto/fetch-files.dto';
import { MD5 } from 'crypto-js';

@Injectable()
export class FileService {
  @Inject('PrismaClient') private prisma: PrismaClient;
  // fileId -> 实际存储路径的映射，避免每次获取文件块的下载路径时都查数据库
  private filePathRecord: Map<string, string> = new Map();

  // 创建文件记录，在实际存储路径位置创建用于存储文件块的文件夹
  async createFile(userId: string, createFileDto: CreateFileDto) {
    let file: File;
    try {
      file = await this.prisma.file.create({
        data: {
          userId,
          ...createFileDto,
        },
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new HttpException('FileExists', HttpStatus.BAD_REQUEST);
      } else {
        throw new HttpException('CreateFileFailed', HttpStatus.BAD_REQUEST);
      }
    }

    const realPath = `assets/${userId}/${file.id}`;

    try {
      await access(realPath);
    } catch (err) {
      await mkdir(realPath);
    } finally {
      this.filePathRecord.set(file.id, realPath);
    }

    return file;
  }

  async createFolder(userId: string, createFileDto: CreateFileDto) {
    let folder: File;
    try {
      folder = await this.prisma.file.create({
        data: {
          userId,
          ...createFileDto,
        },
      });
    } catch (error) {
      return null;
    }
    return folder;
  }

  // 将文件块写入本地，创建文件块记录，更新文件记录
  async uploadChunk(
    chunk: Express.Multer.File,
    uploadChunkDto: UploadChunkDto,
  ) {
    const existChunk = await this.prisma.chunk.findUnique({
      where: {
        fileId_md5: {
          md5: uploadChunkDto.md5,
          fileId: uploadChunkDto.fileId,
        },
      },
    });

    if (existChunk) {
      return 'existChunk';
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
      realPath = `assets/${file.userId}/${file.id}`;
      this.filePathRecord.set(uploadChunkDto.fileId, realPath);
    }

    await writeFile(`${realPath}/${uploadChunkDto.md5}`, chunk.buffer, {
      flag: 'a',
    });

    const uploadedChunk = await this.prisma.chunk.create({
      data: uploadChunkDto,
    });

    const updatedFile = await this.prisma.file.update({
      where: { id: uploadChunkDto.fileId },
      data: { uploadSize: { increment: uploadedChunk.size } },
    });

    return updatedFile;
  }

  // 获取文件信息
  async getFileInfo(files: string[]) {
    const downloadFiles = await this.prisma.file.findMany({
      where: { id: { in: files } },
      include: { chunks: true },
    });
    const res: typeof downloadFiles = [];
    for (const file of downloadFiles) {
      if (file.type === 'folder') {
        const insideFiles = await this.prisma.file.findMany({
          where: { path: { startsWith: file.path + '/' + file.name } },
          select: { id: true },
        });
        res.push(
          ...(await this.getFileInfo(insideFiles.map((file) => file.id))),
        );
      } else {
        res.push(file);
      }
    }
    return res;
  }

  // 获取文件块的实际存储路径
  async getChunkPath(id: string, md5: string) {
    let realPath = '';
    if (this.filePathRecord.has(id)) {
      realPath = `${this.filePathRecord.get(id)}`;
    } else {
      const chunk = await this.prisma.chunk.findUnique({
        where: { fileId_md5: { md5, fileId: id } },
        include: {
          file: {
            select: {
              userId: true,
              id: true,
            },
          },
        },
      });
      realPath = `assets/${chunk.file.userId}/${chunk.file.id}`;
      this.filePathRecord.set(id, realPath);
    }
    return `${realPath}/${md5}`;
  }

  // 获取用户文件列表
  async filesList(userId: string, fetchFilesDto: FetchFilesDto) {
    if (!['updatedAt', 'name', 'size'].includes(fetchFilesDto.sortBy)) {
      fetchFilesDto.sortBy = 'updatedAt';
    }
    if (!['asc', 'desc'].includes(fetchFilesDto.orderBy)) {
      fetchFilesDto.orderBy = 'desc';
    }
    if (fetchFilesDto.keyword) {
      const files = await this.prisma.file.findMany({
        where: { userId, name: { contains: fetchFilesDto.keyword } },
        orderBy: {
          [fetchFilesDto.sortBy]: fetchFilesDto.orderBy,
        },
      });
      return [
        ...files.filter((v) => v.type === 'folder'),
        ...files.filter((v) => v.type !== 'folder'),
      ];
    } else {
      const files = await this.prisma.file.findMany({
        where: { userId, path: fetchFilesDto.path },
        orderBy: {
          [fetchFilesDto.sortBy]: fetchFilesDto.orderBy,
        },
      });
      return [
        ...files.filter((v) => v.type === 'folder'),
        ...files.filter((v) => v.type !== 'folder'),
      ];
    }
  }

  async deleteFile(fileId: string[]) {
    const files = await this.prisma.file.findMany({
      where: { id: { in: fileId } },
      include: { chunks: true },
    });

    for (const file of files) {
      if (file.type !== 'folder') {
        try {
          for (const chunk of file.chunks) {
            await unlink(`assets/${file.userId}/${file.id}/${chunk.md5}`);
          }
          await rmdir(`assets/${file.userId}/${file.id}`);
        } catch (err) {}
      } else {
        const cascadeDeleteFiles = await this.prisma.file.findMany({
          where: { path: { startsWith: file.path + '/' + file.name } },
          select: { id: true },
        });
        await this.deleteFile(cascadeDeleteFiles.map((v) => v.id));
      }
    }
    await this.prisma.file.deleteMany({ where: { id: { in: fileId } } });

    return 'deleteSuccess';
  }

  // 统计目录下的文件信息
  async calcFiles(userId: string, path: string) {
    const res = { size: 0, uploadSize: 0, fileCount: 0, folderCount: 0 };
    const files = await this.filesList(userId, { path });
    if (!files) return res;
    for (const file of files) {
      if (file.type === 'folder') {
        const subRes = await this.calcFiles(userId, path + '/' + file.name);
        res.size += subRes.size;
        res.uploadSize += subRes.uploadSize;
        res.fileCount += subRes.fileCount;
        res.folderCount += subRes.folderCount + 1;
      } else {
        res.size += file.size;
        res.uploadSize += file.uploadSize;
        res.fileCount++;
      }
    }
    return res;
  }

  // 获取指定文件的详细信息
  async fileInfo(fileId: string) {
    const file = await this.prisma.file.findUnique({
      where: { id: fileId },
    });

    let fileCount = 0;
    let folderCount = 0;
    if (file.type === 'folder') {
      const total = await this.calcFiles(
        file.userId,
        file.path + '/' + file.name,
      );
      file.size += total.size;
      file.uploadSize += total.uploadSize;
      fileCount = total.fileCount;
      folderCount = total.folderCount;
    }
    return { fileCount, folderCount, ...file };
  }

  // 级联修改文件夹信息
  async updateFolderPath(folder: File, newName: string) {
    const prefix = folder.path + '/' + folder.name;
    const files = await this.prisma.file.findMany({
      where: { path: { startsWith: prefix } },
    });
    for (const relatedFile of files) {
      await this.prisma.file.update({
        where: { id: relatedFile.id },
        data: {
          path: relatedFile.path.replace(prefix, folder.path + '/' + newName),
        },
      });
    }
  }

  // 重命名文件
  async renameFile(fileId: string, newName: string) {
    const file = await this.prisma.file.findUnique({
      where: { id: fileId },
    });

    const data: { name: string; sign?: string } = { name: newName };

    if (file.type === 'folder') {
      data.sign = MD5(newName).toString();
      await this.updateFolderPath(file, newName);
    }

    await this.prisma.file.update({
      where: { id: fileId },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });

    return 'renameSuccess';
  }

  // 将已有文件保存至指定位置，也做分享时保存到我的网盘使用
  async pasteFiles(fileId: string[], newPath: string, userId?: string) {
    const files = await this.prisma.file.findMany({
      where: { id: { in: fileId } },
      include: { chunks: true },
    });

    for (const file of files) {
      if (file.type !== 'folder') {
        const newFile = await this.createFile(userId ?? file.userId, {
          name: file.name,
          path: newPath,
          size: file.size,
          sign: file.sign,
          type: file.type,
        });
        const srcRealPath = `assets/${file.userId}/${file.id}`;
        const targetRealPath = `assets/${userId ?? file.userId}/${newFile.id}`;
        for (const chunk of file.chunks) {
          await copyFile(
            srcRealPath + '/' + chunk.md5,
            targetRealPath + '/' + chunk.md5,
          );
          await this.prisma.chunk.create({
            data: {
              md5: chunk.md5,
              order: chunk.order,
              size: chunk.size,
              fileId: newFile.id,
            },
          });
        }
      } else {
        const files = await this.prisma.file.findMany({
          where: { path: { startsWith: file.path + '/' + file.name } },
          select: { id: true },
        });
        await this.pasteFiles(
          files.map((file) => file.id),
          newPath + '/' + file.name,
          userId,
        );
      }
    }
    return 'pasteSuccess';
  }

  async copyFiles(fileId: string[], newPath: string, userId?: string) {
    await this.pasteFiles(fileId, newPath, userId);
    return userId ? 'saveSuccess' : 'copySuccess';
  }

  async cutFiles(fileId: string[], newPath: string) {
    await this.pasteFiles(fileId, newPath);
    await this.deleteFile(fileId);
    return 'cutSuccess';
  }
}
