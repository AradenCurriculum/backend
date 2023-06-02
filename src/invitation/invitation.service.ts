import { Inject, Injectable } from '@nestjs/common';
import { InviteCode, PrismaClient } from '@prisma/client';

type InviteCodeListItem = Omit<InviteCode, 'ownerId'> & { owner: string };

@Injectable()
export class InvitationService {
  @Inject('PrismaClient') private prisma: PrismaClient;

  async create(ownerId: string, role: string) {
    await this.prisma.inviteCode.create({
      data: { ownerId, role },
    });
    return 'CreateSuccess';
  }

  async findAll() {
    const invitations = await this.prisma.inviteCode.findMany({
      include: {
        owner: {
          select: {
            username: true,
          },
        },
      },
    });
    const res: InviteCodeListItem[] = [];
    for (const v of invitations) {
      const temp = Object.assign({}, v, { owner: v.owner.username });
      delete temp.ownerId;
      res.push(temp);
    }
    return res;
  }

  async remove(id: number) {
    const invitation = await this.prisma.inviteCode.delete({
      where: { id },
    });
    return { message: invitation.id === id ? 'DeleteSuccess' : '' };
  }
}
