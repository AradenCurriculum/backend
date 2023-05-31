import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Session,
} from '@nestjs/common';
import { UserService } from './user.service';
import { LoginUserDto } from './dto/login-user.dto';
import { CreateUserDto } from './dto/create-user.dto';

import { RolesGuard } from 'src/common/roles.guard';
import { Roles } from 'src/common/roles.decorator';
import { ValidationPipe } from 'src/common/validate.pipe';
@Controller('/api/v1/user')
@UseGuards(RolesGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('/register')
  register(@Body(new ValidationPipe()) createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Post('/login')
  async login(
    @Body(new ValidationPipe()) loginUserDto: LoginUserDto,
    @Session() session: UserSession,
  ) {
    const user = await this.userService.login(loginUserDto);
    session.user = { id: user.id, role: user.role };
    return 'LoginSuccess';
  }

  @Post('/logout')
  async logout(@Session() session: UserSession) {
    if (session.user) {
      delete session.user;
    }
    return 'LogoutSuccess';
  }

  @Get()
  @Roles('admin')
  findAll() {
    return this.userService.findAll();
  }
}
