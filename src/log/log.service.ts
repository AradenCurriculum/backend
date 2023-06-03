import { Inject, Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { unlink } from 'fs/promises';
import { FindManyDto } from './dto/find-many.dto';

@Injectable()
export class LogService {
  @Inject('PrismaClient') private prisma: PrismaClient;

  findMany(findManyDto: FindManyDto) {
    const { current, pageSize, keyword, sizeRange, createdTime } = findManyDto;
    return this.prisma.log.findMany({
      where: {
        filename: { contains: keyword },
        size: { gte: sizeRange[0], lte: sizeRange[1] },
        updated: { gte: createdTime[0], lte: createdTime[1] },
      },
      skip: (current - 1) * pageSize,
      take: pageSize,
    });
  }

  async remove(filename: string) {
    const file = await this.prisma.log.delete({ where: { filename } });
    await unlink(`logs/${file.filename}`);
    return `removeSuccess`;
  }
}
