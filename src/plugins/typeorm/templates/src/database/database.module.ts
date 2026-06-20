import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService) => {
        const type = (process.env.DB_TYPE as any) || 'postgres';
        const common = {
          type,
          autoLoadEntities: true,
          synchronize: process.env.NODE_ENV !== 'production',
        };
        // SQLite is file-based: it needs a `database` path, not a connection URL.
        if (type === 'better-sqlite3' || type === 'sqlite') {
          return { ...common, database: process.env.DATABASE_PATH || 'dev.db' };
        }
        return { ...common, url: configService.get<string>('DATABASE_URL') };
      },
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
