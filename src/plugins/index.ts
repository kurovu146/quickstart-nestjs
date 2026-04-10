import { PluginRegistry } from '../core/plugin-registry.js'

// Database plugins
import { postgresPlugin } from './postgres/index.js'
import { mysqlPlugin } from './mysql/index.js'
import { mongodbPlugin } from './mongodb/index.js'
import { sqlitePlugin } from './sqlite/index.js'

// ORM plugins
import { prismaPlugin } from './prisma/index.js'
import { typeormPlugin } from './typeorm/index.js'
import { sequelizePlugin } from './sequelize/index.js'
import { mongoosePlugin } from './mongoose/index.js'

// Auth plugins
import { jwtPlugin } from './jwt/index.js'

// Cache plugins
import { redisPlugin } from './redis/index.js'

// Realtime plugins
import { socketIoPlugin } from './socket-io/index.js'
import { websocketPlugin } from './websocket/index.js'

// Docs plugins
import { swaggerPlugin } from './swagger/index.js'

// Infrastructure plugins
import { dockerPlugin } from './docker/index.js'

// Logger plugins
import { pinoPlugin } from './pino/index.js'
import { winstonPlugin } from './winston/index.js'

// Queue plugins
import { bullmqPlugin } from './bullmq/index.js'

// Mailer plugins
import { mailerPlugin } from './mailer/index.js'

// Upload plugins
import { uploadS3Plugin } from './upload-s3/index.js'
import { uploadLocalPlugin } from './upload-local/index.js'

export function loadAllPlugins(registry: PluginRegistry): void {
  // Database
  registry.register(postgresPlugin)
  registry.register(mysqlPlugin)
  registry.register(mongodbPlugin)
  registry.register(sqlitePlugin)

  // ORM
  registry.register(prismaPlugin)
  registry.register(typeormPlugin)
  registry.register(sequelizePlugin)
  registry.register(mongoosePlugin)

  // Auth
  registry.register(jwtPlugin)

  // Cache
  registry.register(redisPlugin)

  // Realtime
  registry.register(socketIoPlugin)
  registry.register(websocketPlugin)

  // Docs
  registry.register(swaggerPlugin)

  // Infrastructure
  registry.register(dockerPlugin)

  // Logger
  registry.register(pinoPlugin)
  registry.register(winstonPlugin)

  // Queue
  registry.register(bullmqPlugin)

  // Mailer
  registry.register(mailerPlugin)

  // Upload
  registry.register(uploadS3Plugin)
  registry.register(uploadLocalPlugin)
}
