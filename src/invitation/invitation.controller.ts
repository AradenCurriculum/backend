import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Session,
} from '@nestjs/common';
import { InvitationService } from './invitation.service';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { RolesGuard } from 'src/common/roles.guard';
import { Roles } from 'src/common/roles.decorator';
import { ValidationPipe } from 'src/common/validate.pipe';

@Controller('/api/v1/invitation')
@UseGuards(RolesGuard)
export class InvitationController {
  constructor(private readonly invitationService: InvitationService) {}

  @Post('/create')
  @Roles('admin')
  create(
    @Body(new ValidationPipe()) createInvitationDto: CreateInvitationDto,
    @Session() session: UserSession,
  ) {
    return this.invitationService.create(
      session.user.id,
      createInvitationDto.role,
    );
  }

  @Get('/invitelist')
  @Roles('admin')
  findAll() {
    return this.invitationService.findAll();
  }

  @Delete(':id')
  @Roles('admin')
  remove(@Param('id') id: string) {
    return this.invitationService.remove(+id);
  }
}
