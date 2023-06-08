import {
  Body,
  Controller,
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
  async createFile(
    @Session() session: UserSession,
    @Body(new ValidationPipe()) createShareDto: CreateShareDto,
  ) {
    return this.shareService.create(session.user.id, createShareDto);
  }
}
