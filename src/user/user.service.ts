import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class UserService {
  @Inject('PrismaClient') private prisma: PrismaClient;

  async create(createUserDto: CreateUserDto) {
    const invitation = await this.prisma.inviteCode.findUnique({
      where: {
        code: createUserDto.inviteCode,
      },
    });

    // if (!invitation || invitation.used) {
    //   throw new HttpException('Invite Code Not Exist', HttpStatus.BAD_REQUEST);
    // }

    delete createUserDto.inviteCode;

    const user = await this.prisma.user.create({
      data: { ...createUserDto, role: 'admin' }, //invitation.role },
    });

    return user;
  }

  findAll() {
    return this.prisma.user.findMany();
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
