import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { UpdateContactDto } from './dto/update-contact.dto';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class ContactService {
  @Inject('PrismaClient') private prisma: PrismaClient;

  private contactIncludes = {
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
  };

  async create(fromId: string, toId: string) {
    const contactInvite = await this.prisma.contact.create({
      data: { fromId, toId, status: 'pending' },
    });
    if (!contactInvite) {
      throw new HttpException('CreateFailed', HttpStatus.BAD_REQUEST);
    }
    return 'sendSuccess';
  }

  findSend(userId: string) {
    return this.prisma.contact.findMany({
      where: { fromId: userId },
      include: this.contactIncludes,
    });
  }

  findRecv(userId: string) {
    return this.prisma.contact.findMany({
      where: { toId: userId },
      include: this.contactIncludes,
    });
  }

  async findFriend(userId: string) {
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
      include: this.contactIncludes,
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

    return contacts;
  }

  findUser(keyword: string, selfId: string) {
    return this.prisma.user.findMany({
      where: {
        AND: [
          {
            OR: [
              { id: keyword },
              { username: { contains: keyword } },
              { email: { contains: keyword } },
            ],
          },
          {
            NOT: {
              OR: [
                { id: selfId },
                {
                  recvInvitation: {
                    some: {
                      fromId: selfId,
                    },
                  },
                },
                {
                  sendInvitation: {
                    some: {
                      toId: selfId,
                    },
                  },
                },
              ],
            },
          },
        ],
      },
      select: {
        id: true,
        username: true,
        email: true,
      },
    });
  }

  async update(id: number, userId: string, updateContactDto: UpdateContactDto) {
    const invitation = await this.prisma.contact.findUnique({ where: { id } });
    if (!invitation) {
      throw new HttpException('InvitationNotExist', HttpStatus.BAD_REQUEST);
    }
    if (invitation.toId !== userId) {
      throw new HttpException('NotCorrectPerson', HttpStatus.BAD_REQUEST);
    }
    const contact = await this.prisma.contact.update({
      where: { id },
      data: { status: updateContactDto.status },
    });
    return `${contact.status}Success`;
  }

  async remove(id: number, userId: string) {
    const contact = await this.prisma.contact.findUnique({
      where: { id },
    });
    if (!contact) {
      throw new HttpException('ContactNotExist', HttpStatus.BAD_REQUEST);
    }
    if (!(contact.fromId === userId || contact.toId === userId)) {
      throw new HttpException('NotCorrectPerson', HttpStatus.BAD_REQUEST);
    }
    await this.prisma.contact.delete({
      where: { id },
    });
    return `deleteSuccess`;
  }
}
