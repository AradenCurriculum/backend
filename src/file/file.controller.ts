import { join } from 'path';
import {
  Controller,
  Post,
  UseInterceptors,
  Body,
  UseGuards,
  Session,
  ValidationPipe,
  UploadedFile,
  Get,
  Res,
  Param,
} from '@nestjs/common';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';

import { FileService } from './file.service';
import { CreateFileDto } from './dto/create-file.dto';
import { UploadChunkDto } from './dto/upload-chunk.dto';

import { RolesGuard } from 'src/common/roles.guard';
import { Roles } from 'src/common/roles.decorator';
import { UploadParamsPipe } from 'src/file/uploadParamsPipe.pipe';
import { FetchFilesDto } from './dto/fetch-files.dto';

@Controller('/api/v1/file')
@UseGuards(RolesGuard)
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Post('create')
  @Roles('user', 'admin')
  async createFile(
    @Session() session: UserSession,
    @Body(new ValidationPipe()) createFileDto: CreateFileDto,
  ) {
    return this.fileService.createFile(session.user.id, createFileDto);
  }

  @Post('chunk')
  @Roles('user', 'admin')
  @UseInterceptors(FileInterceptor('chunk'))
  async uploadChunk(
    @UploadedFile() chunk: Express.Multer.File,
    @Body(new UploadParamsPipe(), new ValidationPipe())
    uploadChunkDto: UploadChunkDto,
  ) {
    return this.fileService.uploadChunk(chunk, uploadChunkDto);
  }

  @Get('chunk/:md5')
  @Roles('user', 'admin')
  async downloadChunk(@Param('md5') md5: string, @Res() res: Response) {
    const path = await this.fileService.getChunkPath(md5);
    const url = join(process.cwd(), path);
    res.download(url);
  }

  @Get(':id')
  @Roles('user', 'admin')
  downloadFile(@Param('id') id: string) {
    return this.fileService.downloadFile(id);
  }

  @Post('list')
  @Roles('user', 'admin')
  fetchFilesList(
    @Session() session: UserSession,
    @Body(new ValidationPipe()) fetchFilesDto: FetchFilesDto,
  ) {
    return this.fileService.filesList(session.user.id, fetchFilesDto);
  }
}
