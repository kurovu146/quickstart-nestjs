import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    SequelizeModule.forRootAsync({
      useFactory: (configService: ConfigService) => {
        const url = configService.get<string>('DATABASE_URL') || '';
        const common = {
          autoLoadModels: true,
          synchronize: process.env.NODE_ENV !== 'production',
        };
        // SQLite uses a dialect + storage path rather than a connection URI.
        if (url.startsWith('file:') || url.startsWith('sqlite:')) {
          return {
            ...common,
            dialect: 'sqlite' as const,
            storage: url.replace(/^file:/, '').replace(/^sqlite:/, '') || 'dev.db',
          };
        }
        return { ...common, uri: url };
      },
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
