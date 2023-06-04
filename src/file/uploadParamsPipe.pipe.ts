import { PipeTransform, Injectable } from '@nestjs/common';
import { UploadChunkDto } from './dto/upload-chunk.dto';

@Injectable()
export class UploadParamsPipe implements PipeTransform {
  transform(value: UploadChunkDto) {
    value.order = Number(value.order);
    value.size = Number(value.size);
    return value;
  }
}
