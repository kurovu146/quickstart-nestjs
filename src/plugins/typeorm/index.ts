import path from 'path'
import { definePlugin } from '../../core/types.js'

export const typeormPlugin = definePlugin({
  name: 'typeorm',
  category: 'orm',
  displayName: 'TypeORM',
  description: 'Full-featured ORM with decorator-based entities',
  conflicts: ['prisma', 'sequelize', 'mongoose'],
  requires: ['postgres', 'mysql', 'sqlite', 'mongodb'],
  isCompatible: (sel) => sel.database !== null,
  install: async (ctx) => {
    const templateDir = path.join(ctx.pluginsDir, 'typeorm/templates')
    ctx.copyTemplates(path.join(templateDir, 'src'), 'src')

    const dbDriverMap: Record<string, string> = {
      postgres: 'pg',
      mysql: 'mysql2',
      mongodb: 'mongodb',
      sqlite: 'better-sqlite3',
    }
    // TypeORM's `type` option differs from the npm driver name for some DBs.
    const typeormTypeMap: Record<string, string> = {
      postgres: 'postgres',
      mysql: 'mysql',
      mongodb: 'mongodb',
      sqlite: 'better-sqlite3',
    }
    const db = ctx.selections.database || 'postgres'
    const driver = dbDriverMap[db]

    ctx.addDependencies({
      typeorm: '^0.3.20',
      '@nestjs/typeorm': '^11.0.0',
      [driver]: 'latest',
    })
    // database.module reads DB_TYPE; set it so the right driver is used out of
    // the box instead of always defaulting to postgres.
    ctx.addEnvVars({ DB_TYPE: typeormTypeMap[db] || 'postgres' })
    ctx.registerModule('DatabaseModule', './database/database.module')
  },
})
