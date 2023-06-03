import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Session,
} from '@nestjs/common';
import { ContactService } from './contact.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { RolesGuard } from 'src/common/roles.guard';
import { Roles } from 'src/common/roles.decorator';

@Controller('/api/v1/contact')
@UseGuards(RolesGuard)
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post('create')
  @Roles('user', 'admin')
  create(
    @Body() createContactDto: CreateContactDto,
    @Session() session: UserSession,
  ) {
    return this.contactService.create(session.user.id, createContactDto.id);
  }

  @Get('receive')
  @Roles('user', 'admin')
  findRecv(@Session() session: UserSession) {
    return this.contactService.findRecv(session.user.id);
  }

  @Get('send')
  @Roles('user', 'admin')
  findSend(@Session() session: UserSession) {
    return this.contactService.findSend(session.user.id);
  }

  @Get('friend')
  @Roles('user', 'admin')
  findFriend(@Session() session: UserSession) {
    return this.contactService.findFriend(session.user.id);
  }

  @Post('user')
  @Roles('user', 'admin')
  findUser(@Body('keyword') keyword: string, @Session() session: UserSession) {
    return this.contactService.findUser(keyword, session.user.id);
  }

  @Patch(':id')
  @Roles('user', 'admin')
  update(
    @Param('id') id: string,
    @Body() updateContactDto: UpdateContactDto,
    @Session() session: UserSession,
  ) {
    return this.contactService.update(+id, session.user.id, updateContactDto);
  }

  @Delete(':id')
  @Roles('user', 'admin')
  remove(@Param('id') id: string, @Session() session: UserSession) {
    return this.contactService.remove(+id, session.user.id);
  }
}
