import path from 'path'
import { definePlugin } from '../../core/types.js'

export const redisPlugin = definePlugin({
  name: 'redis',
  category: 'cache',
  displayName: 'Redis',
  description: 'In-memory data store for caching',
  conflicts: [],
  install: async (ctx) => {
    const templateDir = path.join(ctx.pluginsDir, 'redis/templates')
    ctx.copyTemplates(path.join(templateDir, 'src'), 'src')

    ctx.addDependencies({
      '@nestjs/cache-manager': '^3.0.0',
      'cache-manager': '^6.0.0',
      'cache-manager-redis-yet': '^5.0.0',
      keyv: '^5.0.0',
      redis: '^4.7.0',
    })
    ctx.addEnvVars({
      REDIS_HOST: 'localhost',
      REDIS_PORT: '6379',
    })
    ctx.addDockerService('redis', {
      image: 'redis:7-alpine',
      restart: 'unless-stopped',
      ports: ['6379:6379'],
      volumes: ['redis_data:/data'],
    })
    ctx.registerModule('CacheModule', './cache/cache.module')
  },
})
