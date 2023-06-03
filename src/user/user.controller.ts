import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Session,
  Patch,
  Delete,
  Param,
} from '@nestjs/common';
import { UserService } from './user.service';
import { LoginUserDto } from './dto/login-user.dto';
import { CreateUserDto } from './dto/create-user.dto';

import { RolesGuard } from 'src/common/roles.guard';
import { Roles } from 'src/common/roles.decorator';
import { ValidationPipe } from 'src/common/validate.pipe';
import { UpdateUserDto } from './dto/update-user.dto';
import { NestLogger } from 'nest-logs';

@NestLogger()
@Controller('/api/v1/user')
@UseGuards(RolesGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('/register')
  async register(@Body(new ValidationPipe()) createUserDto: CreateUserDto) {
    await this.userService.create(createUserDto);
    return 'RegisterSuccess';
  }

  @Post('/login')
  async login(
    @Body(new ValidationPipe()) loginUserDto: LoginUserDto,
    @Session() session: UserSession,
  ) {
    const user = await this.userService.login(loginUserDto);
    session.user = { id: user.id, role: user.role };
    return { message: 'LoginSuccess', ...session.user };
  }

  @Get('/whoAmI')
  async whoAmI(@Session() session: UserSession) {
    if (session.user) {
      return { message: 'ReLoginSuccess', ...session.user };
    }
    return null;
  }

  @Post('/logout')
  async logout(@Session() session: UserSession) {
    if (session.user) {
      delete session.user;
    }
    return 'LogoutSuccess';
  }

  // Roles 为 所有角色 的时候不就是需要登录吗 :)
  @Get('/info')
  @Roles('user', 'admin')
  async userinfo(@Session() session: UserSession) {
    const user = await this.userService.findOne(session.user.id);
    user.password = '********';
    return user;
  }

  @Patch('/update')
  @Roles('user', 'admin')
  async update(
    @Body(new ValidationPipe()) updateUserDto: UpdateUserDto,
    @Session() session: UserSession,
  ) {
    const user = await this.userService.update(session.user.id, updateUserDto);
    user.password = '********';
    return { message: 'EditSuccess', ...user };
  }

  @Get('/list')
  @Roles('admin')
  findMany() {
    return this.userService.findMany();
  }

  @Delete('/:id')
  @Roles('admin')
  remove(@Session() session: UserSession, @Param('id') id: string) {
    if (id === session.user.id) {
      return { message: 'DeleteSelf' };
    }
    return this.userService.remove(id);
  }

  @Post('/info')
  @Roles('admin')
  async getUserInfo(@Body('id') id: string) {
    const user = await this.userService.findOne(id);
    user.password = '********';
    return user;
  }
}
