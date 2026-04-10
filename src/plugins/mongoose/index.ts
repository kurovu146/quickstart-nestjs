import path from 'path'
import { definePlugin } from '../../core/types.js'

export const mongoosePlugin = definePlugin({
  name: 'mongoose',
  category: 'orm',
  displayName: 'Mongoose',
  description: 'Elegant MongoDB ODM',
  conflicts: ['prisma', 'typeorm', 'sequelize'],
  requires: ['mongodb'],
  isCompatible: (sel) => sel.database === 'mongodb',
  install: async (ctx) => {
    const templateDir = path.join(ctx.pluginsDir, 'mongoose/templates')
    ctx.copyTemplates(path.join(templateDir, 'src'), 'src')

    ctx.addDependencies({
      '@nestjs/mongoose': '^11.0.0',
      mongoose: '^8.9.0',
    })
    ctx.registerModule('DatabaseModule', './database/database.module')
  },
})
