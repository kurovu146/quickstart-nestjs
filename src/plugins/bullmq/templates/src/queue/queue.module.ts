import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    BullModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          // env values are strings — coerce so bullmq gets a real number.
          port: Number(configService.get('REDIS_PORT', 6379)),
        },
      }),
      inject: [ConfigService],
    }),
  ],
})
export class QueueModule {}
