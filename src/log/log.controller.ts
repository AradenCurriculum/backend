import {
  Controller,
  Get,
  Post,
  Param,
  Delete,
  UploadedFile,
  UseInterceptors,
  Res,
  UseGuards,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express, Response } from 'express';

import { LogService } from './log.service';
import { createReadStream } from 'fs';
import { join } from 'path';
import { RolesGuard } from 'src/common/roles.guard';
import { Roles } from 'src/common/roles.decorator';

@Controller('/api/v1/log')
@UseGuards(RolesGuard)
export class LogController {
  constructor(private readonly logService: LogService) {}

  @Post('upload')
  @Roles('admin')
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    console.log(file);
    return file;
  }

  @Get('download')
  getFile(@Query('file') filename: string, @Res() res: Response) {
    const file = createReadStream(join(process.cwd(), `logs/${filename}`));
    file.pipe(res);
  }

  @Post()
  findAll() {
    return this.logService.findMany();
  }

  @Delete(':filename')
  @Roles('admin')
  remove(@Param('filename') filename: string) {
    return this.logService.remove(filename);
  }
}
