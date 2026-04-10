import path from 'path'
import { definePlugin } from '../../core/types.js'

export const winstonPlugin = definePlugin({
  name: 'winston',
  category: 'logger',
  displayName: 'Winston',
  description: 'Versatile logging library with multiple transports',
  conflicts: ['pino'],
  install: async (ctx) => {
    const templateDir = path.join(import.meta.dirname, 'templates')
    ctx.copyTemplates(path.join(templateDir, 'src'), 'src')

    ctx.addDependencies({
      'nest-winston': '^1.10.0',
      winston: '^3.17.0',
    })
    ctx.registerModule('LoggerModule', './logger/logger.module')
  },
})
