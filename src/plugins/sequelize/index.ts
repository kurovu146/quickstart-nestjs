import path from 'path'
import { definePlugin } from '../../core/types.js'

export const sequelizePlugin = definePlugin({
  name: 'sequelize',
  category: 'orm',
  displayName: 'Sequelize',
  description: 'Promise-based ORM with transaction support',
  conflicts: ['prisma', 'typeorm', 'mongoose'],
  requires: ['postgres', 'mysql', 'sqlite'],
  isCompatible: (sel) => sel.database !== 'mongodb' && sel.database !== null,
  install: async (ctx) => {
    const templateDir = path.join(import.meta.dirname, 'templates')
    ctx.copyTemplates(path.join(templateDir, 'src'), 'src')

    const driverMap: Record<string, string[]> = {
      postgres: ['pg', 'pg-hstore'],
      mysql: ['mysql2'],
      sqlite: ['sqlite3'],
    }
    const db = ctx.selections.database || 'postgres'
    const drivers = driverMap[db] || []

    ctx.addDependencies({
      '@nestjs/sequelize': '^11.0.0',
      sequelize: '^6.37.0',
      'sequelize-typescript': '^2.1.6',
    })
    for (const d of drivers) {
      ctx.addDependencies({ [d]: 'latest' })
    }
    ctx.registerModule('DatabaseModule', './database/database.module')
  },
})
