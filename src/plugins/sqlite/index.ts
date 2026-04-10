import { definePlugin } from '../../core/types.js'

export const sqlitePlugin = definePlugin({
  name: 'sqlite',
  category: 'database',
  displayName: 'SQLite',
  description: 'Lightweight, file-based database',
  conflicts: ['postgres', 'mysql', 'mongodb'],
  install: async (ctx) => {
    ctx.addEnvVars({
      DATABASE_URL: 'file:./dev.db',
    })
  },
})
