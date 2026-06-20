import { Module } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import { createKeyv } from '@keyv/redis';

@Module({
  imports: [
    NestCacheModule.registerAsync({
      isGlobal: true,
      useFactory: (configService: ConfigService) => {
        const host = configService.get<string>('REDIS_HOST', 'localhost');
        // env values are strings — coerce so the redis client gets a real number.
        const port = Number(configService.get('REDIS_PORT', 6379));
        return {
          stores: [createKeyv(`redis://${host}:${port}`)],
          ttl: 60 * 1000, // 60 seconds default TTL
        };
      },
      inject: [ConfigService],
    }),
  ],
})
export class CacheModule {}
