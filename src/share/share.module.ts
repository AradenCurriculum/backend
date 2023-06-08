import { Module } from '@nestjs/common';
import { ShareService } from './share.service';
import { ShareController } from './share.controller';
import { FileService } from 'src/file/file.service';
import { FileModule } from 'src/file/file.module';

@Module({
  controllers: [ShareController],
  providers: [ShareService, FileService],
  imports: [FileModule],
})
export class ShareModule {}
