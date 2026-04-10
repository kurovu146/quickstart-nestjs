import path from 'path'
import { definePlugin } from '../../core/types.js'

export const pinoPlugin = definePlugin({
  name: 'pino',
  category: 'logger',
  displayName: 'Pino',
  description: 'Fast, low overhead JSON logger',
  conflicts: ['winston'],
  install: async (ctx) => {
    const templateDir = path.join(import.meta.dirname, 'templates')
    ctx.copyTemplates(path.join(templateDir, 'src'), 'src')

    ctx.addDependencies({
      'nestjs-pino': '^4.0.0',
      'pino-http': '^10.0.0',
      'pino-pretty': '^13.0.0',
    })
    ctx.registerModule('LoggerModule', './logger/logger.module')
  },
})
