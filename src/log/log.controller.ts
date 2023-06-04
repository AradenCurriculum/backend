import { join } from 'path';

import {
  Controller,
  Get,
  Post,
  Param,
  Delete,
  Res,
  UseGuards,
  Query,
  Body,
  ValidationPipe,
} from '@nestjs/common';
import { Response } from 'express';

import { FindManyDto } from './dto/find-many.dto';
import { LogService } from './log.service';
import { RolesGuard } from 'src/common/roles.guard';
import { Roles } from 'src/common/roles.decorator';
import { readFile } from 'fs/promises';

@Controller('/api/v1/log')
@UseGuards(RolesGuard)
export class LogController {
  constructor(private readonly logService: LogService) {}

  @Get('download')
  @Roles('admin')
  getFile(@Query('filename') filename: string, @Res() res: Response) {
    const url = join(process.cwd(), `logs/${filename}`);
    res.download(url);
  }

  @Get('export')
  @Roles('admin')
  async downLoad(@Query('filename') filename: string) {
    const file = await readFile(`logs/${filename}`);
    return { data: file.toString() };
  }

  @Post()
  @Roles('admin')
  findMany(@Body(new ValidationPipe()) findManyDto: FindManyDto) {
    return this.logService.findMany(findManyDto);
  }

  @Delete(':filename')
  @Roles('admin')
  remove(@Param('filename') filename: string) {
    return this.logService.remove(filename);
  }
}
