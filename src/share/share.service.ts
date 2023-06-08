import { Inject, Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CreateShareDto } from './dto/create-share.dto';
import { FileService } from 'src/file/file.service';

@Injectable()
export class ShareService {
  @Inject('PrismaClient') private prisma: PrismaClient;

  constructor(private readonly fileService: FileService) {}

  create(ownerId: string, createShareDto: CreateShareDto) {
    if (createShareDto.overTime) {
      createShareDto.overTime = new Date(createShareDto.overTime);
    }
    const { files, receivers, ...otherParams } = createShareDto;
    return this.prisma.share.create({
      data: {
        ownerId,
        files: { connect: files.map((id) => ({ id })) },
        receiver: { connect: receivers.map((id) => ({ id })) },
        ...otherParams,
      },
    });
  }

  findSend(userId: string) {
    return this.prisma.share.findMany({
      where: { ownerId: userId },
      include: {
        files: { select: { name: true } },
        receiver: { select: { username: true } },
      },
    });
  }

  findRecv(userId: string) {
    return this.prisma.share.findMany({
      where: { receiver: { some: { id: userId } } },
      include: {
        files: { select: { name: true } },
        receiver: { select: { username: true } },
      },
    });
  }

  async deleteShare(userId: string, shareId: string[]) {
    const result = await this.prisma.share.deleteMany({
      where: { id: { in: shareId }, ownerId: userId },
    });
    return result.count > 0 ? 'deleteSuccess' : null;
  }

  getAllFile(userId: string) {
    return this.prisma.file.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        path: true,
      },
    });
  }

  async getAllPath(userId: string) {
    const folders = await this.prisma.file.findMany({
      where: { userId, type: 'folder' },
    });
    const res: { path: string }[] = [{ path: '' }];
    for (const folder of folders) {
      res.push({ path: folder.path + '/' + folder.name });
    }
    return res;
  }

  async getFriend(userId: string) {
    const contacts = await this.prisma.contact.findMany({
      where: {
        OR: [
          {
            fromId: userId,
            status: 'resolve',
          },
          {
            toId: userId,
            status: 'resolve',
          },
        ],
      },
      include: {
        from: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        to: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    contacts.forEach((v) => {
      if (v.toId === userId) {
        const temp = v.to;
        const tempId = v.toId;
        v.to = v.from;
        v.toId = v.fromId;
        v.from = temp;
        v.fromId = tempId;
      }
    });

    return contacts.map((contact) => ({
      id: contact.to.id,
      username: contact.to.username,
      email: contact.to.email,
    }));
  }

  async saveToDisk(shareId: string, path: string, userId: string) {
    const share = await this.prisma.share.findUnique({
      where: { id: shareId },
      include: { files: true },
    });
    return this.fileService.copyFiles(
      share.files.map((file) => file.id),
      path,
      userId,
    );
  }
  async download(shareId: string) {
    const files = await this.prisma.share.findUnique({
      where: { id: shareId },
      include: { files: true },
    });
    return this.fileService.getFileInfo(files.files.map((file) => file.id));
  }
}
