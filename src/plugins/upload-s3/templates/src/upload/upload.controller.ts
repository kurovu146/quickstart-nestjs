import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }),
          // Restrict to common safe types. Widen this regex as your app needs.
          new FileTypeValidator({ fileType: /(jpeg|jpg|png|gif|webp|pdf)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.uploadService.upload(file);
  }
}
