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
import { PasteFileDto } from './dto/paste-file.dto';

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

  @Post('folder')
  @Roles('user', 'admin')
  async createFolder(
    @Session() session: UserSession,
    @Body(new ValidationPipe()) createFileDto: CreateFileDto,
  ) {
    return this.fileService.createFolder(session.user.id, createFileDto);
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

  @Post('download')
  downloadFile(@Body('files') files: string[]) {
    return this.fileService.getFileInfo(files);
  }

  @Get(':id/:md5')
  @Roles('user', 'admin')
  async downloadChunk(
    @Param('id') id: string,
    @Param('md5') md5: string,
    @Res() res: Response,
  ) {
    const path = await this.fileService.getChunkPath(id, md5);
    const url = join(process.cwd(), path);
    res.download(url);
  }

  @Post('list')
  @Roles('user', 'admin')
  fetchFilesList(
    @Session() session: UserSession,
    @Body(new ValidationPipe()) fetchFilesDto: FetchFilesDto,
  ) {
    return this.fileService.filesList(session.user.id, fetchFilesDto);
  }

  @Post('delete')
  @Roles('user', 'admin')
  deleteFiles(@Body('files') files: string[]) {
    return this.fileService.deleteFile(files);
  }

  @Post('info')
  @Roles('user', 'admin')
  fileInfo(@Body('fileId') fileId: string) {
    return this.fileService.fileInfo(fileId);
  }

  @Post('rename')
  @Roles('user', 'admin')
  renameFile(@Body('fileId') fileId: string, @Body('newName') newName: string) {
    return this.fileService.renameFile(fileId, newName);
  }

  @Post('copy')
  @Roles('user', 'admin')
  copyFile(@Body(new ValidationPipe()) pasteFileDto: PasteFileDto) {
    return this.fileService.copyFiles(
      pasteFileDto.fileId,
      pasteFileDto.newPath,
    );
  }

  @Post('cut')
  @Roles('user', 'admin')
  cutFile(@Body(new ValidationPipe()) pasteFileDto: PasteFileDto) {
    return this.fileService.cutFiles(pasteFileDto.fileId, pasteFileDto.newPath);
  }
}
