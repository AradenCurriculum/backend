import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { MD5 } from 'crypto-js';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { LoginUserDto } from './dto/login-user.dto';

@Injectable()
export class UserService {
  @Inject('PrismaClient') private prisma: PrismaClient;

  private async findUser(username: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
    });
    return user;
  }

  async create(createUserDto: CreateUserDto) {
    if (this.findUser(createUserDto.username)) {
      throw new HttpException('Repetitive Username', HttpStatus.BAD_REQUEST);
    }

    const invitation = await this.prisma.inviteCode.findUnique({
      where: {
        code: createUserDto.inviteCode,
      },
    });

    // if (!invitation || invitation.used) {
    //   throw new HttpException('Invite Code Not Exist', HttpStatus.BAD_REQUEST);
    // }

    delete createUserDto.inviteCode;
    createUserDto.password = MD5(createUserDto.password).toString();

    const user = await this.prisma.user.create({
      data: { ...createUserDto, role: 'admin' }, //invitation.role },
    });

    return user;
  }

  async login(loginUserDto: LoginUserDto) {
    const user = await this.findUser(loginUserDto.username);

    if (!user) {
      throw new HttpException('Username Not Exist', HttpStatus.NOT_FOUND);
    }

    if (user.password !== MD5(loginUserDto.password).toString()) {
      throw new HttpException('Password Error', HttpStatus.BAD_REQUEST);
    }

    await this.update(user.id, { loginTime: new Date() });

    return user;
  }

  findAll() {
    return this.prisma.user.findMany();
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    if (updateUserDto.username && this.findUser(updateUserDto.username)) {
      throw new HttpException('Repetitive Username', HttpStatus.BAD_REQUEST);
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: updateUserDto,
    });

    return updatedUser;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
