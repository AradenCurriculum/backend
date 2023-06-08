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
}
