import { Inject, Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class InvitationService {
  @Inject('PrismaClient') private prisma: PrismaClient;

  async create(ownerId: string, role?: string) {
    const invitation = await this.prisma.inviteCode.create({
      data: { ownerId, role },
    });
    return invitation;
  }

  findAll() {
    return this.prisma.inviteCode.findMany();
  }

  async remove(id: number) {
    const invitation = await this.prisma.inviteCode.delete({
      where: { id },
    });
    return { data: invitation.id === id };
  }
}
