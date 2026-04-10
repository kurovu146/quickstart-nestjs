import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class UploadService {
  private uploadDir = path.join(process.cwd(), 'uploads');

  constructor() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async upload(file: Express.Multer.File) {
    const filename = `${randomUUID()}-${file.originalname}`;
    const filepath = path.join(this.uploadDir, filename);

    fs.writeFileSync(filepath, file.buffer);

    return {
      filename,
      path: filepath,
      size: file.size,
    };
  }
}
