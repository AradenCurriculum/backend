import { Inject, Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { unlink } from 'fs/promises';
import { FindManyDto } from './dto/find-many.dto';

@Injectable()
export class LogService {
  @Inject('PrismaClient') private prisma: PrismaClient;

  async findMany(findManyDto: FindManyDto) {
    const { current, pageSize, keyword, sizeRange, createdTime } = findManyDto;
    if (!createdTime[0]) createdTime[0] = '1970-1-1';
    if (!createdTime[1]) createdTime[1] = '2100-1-1';
    const logs = await this.prisma.log.findMany({
      where: {
        filename: { contains: keyword },
        size: { gte: sizeRange[0], lte: sizeRange[1] },
        updated: {
          gte: new Date(createdTime[0]),
          lte: new Date(createdTime[1]),
        },
      },
      skip: (current - 1) * pageSize,
      take: pageSize,
      orderBy: {
        updated: 'desc',
      },
    });
    const total = await this.prisma.log.count({
      where: {
        filename: { contains: keyword },
        size: { gte: sizeRange[0], lte: sizeRange[1] },
        updated: {
          gte: new Date(createdTime[0]),
          lte: new Date(createdTime[1]),
        },
      },
    });
    return {
      data: logs,
      total,
    };
  }

  async remove(filename: string) {
    const file = await this.prisma.log.delete({ where: { filename } });
    await unlink(`logs/${file.filename}`);
    return `removeSuccess`;
  }
}
