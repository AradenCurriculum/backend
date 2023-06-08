import { Inject, Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CreateShareDto } from './dto/create-share.dto';

@Injectable()
export class ShareService {
  @Inject('PrismaClient') private prisma: PrismaClient;

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
            username: true,
            email: true,
          },
        },
        to: {
          select: {
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
      id: contact.id,
      username: contact.to.username,
      email: contact.to.email,
    }));
  }
}
