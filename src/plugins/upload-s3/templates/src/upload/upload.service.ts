import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import { basename } from 'path';

@Injectable()
export class UploadService {
  private s3: S3Client;
  private bucket: string;

  constructor(private configService: ConfigService) {
    this.s3 = new S3Client({
      region: this.configService.get<string>('AWS_REGION'),
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID')!,
        secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY')!,
      },
    });
    this.bucket = this.configService.get<string>('AWS_S3_BUCKET')!;
  }

  async upload(file: Express.Multer.File) {
    // Sanitize the client-supplied name so the S3 key stays a single, clean
    // segment (no "../", no path separators leaking into the object key).
    const safeName = basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g, '_');
    const key = `${randomUUID()}-${safeName}`;

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );

    return {
      key,
      url: `https://${this.bucket}.s3.amazonaws.com/${key}`,
    };
  }
}
