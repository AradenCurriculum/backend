import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { UpdateContactDto } from './dto/update-contact.dto';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class ContactService {
  @Inject('PrismaClient') private prisma: PrismaClient;

  async create(fromId: string, toId: string) {
    const contactInvite = await this.prisma.contact.create({
      data: { fromId, toId, status: 'pending' },
    });
    if (!contactInvite) {
      throw new HttpException('CreateFailed', HttpStatus.BAD_REQUEST);
    }
    return 'SendSuccess';
  }

  findAll(userId: string, type: string) {
    const params = {};
    if (type === 'send') {
      params['fromId'] = userId;
    } else if (type === 'recv') {
      params['toId'] = userId;
    } else if (type === 'friend') {
      params['OR'] = [
        {
          fromId: userId,
          status: 'resolve',
        },
        {
          toId: userId,
          status: 'resolve',
        },
      ];
    }

    return this.prisma.contact.findMany({
      where: params,
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
    return `DeleteSuccess`;
  }
}
