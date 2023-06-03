import { Inject, Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { unlink } from 'fs/promises';

@Injectable()
export class LogService {
  @Inject('PrismaClient') private prisma: PrismaClient;

  findMany() {
    return this.prisma.log.findMany({});
  }

  async remove(filename: string) {
    const file = await this.prisma.log.delete({ where: { filename } });
    await unlink(`logs/${file.filename}`);
    return `removeSuccess`;
  }
}
