import {
  Body,
  Controller,
  Get,
  Post,
  Session,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { ShareService } from './share.service';
import { RolesGuard } from 'src/common/roles.guard';
import { Roles } from 'src/common/roles.decorator';
import { CreateShareDto } from './dto/create-share.dto';

@Controller('api/v1/share')
@UseGuards(RolesGuard)
export class ShareController {
  constructor(private readonly shareService: ShareService) {}

  @Post('create')
  @Roles('user', 'admin')
  createFile(
    @Session() session: UserSession,
    @Body(new ValidationPipe()) createShareDto: CreateShareDto,
  ) {
    return this.shareService.create(session.user.id, createShareDto);
  }

  @Get('recv')
  @Roles('user', 'admin')
  getRecv(@Session() session: UserSession) {
    return this.shareService.findRecv(session.user.id);
  }

  @Get('send')
  @Roles('user', 'admin')
  getSend(@Session() session: UserSession) {
    return this.shareService.findSend(session.user.id);
  }

  @Post('delete')
  @Roles('user', 'admin')
  deleteShare(
    @Session() session: UserSession,
    @Body('shares') shares: string[],
  ) {
    return this.shareService.deleteShare(session.user.id, shares);
  }
}
