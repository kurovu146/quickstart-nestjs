import path from 'path'
import { definePlugin } from '../../core/types.js'

export const bullmqPlugin = definePlugin({
  name: 'bullmq',
  category: 'queue',
  displayName: 'BullMQ',
  description: 'Redis-based queue for background jobs',
  conflicts: [],
  requires: ['redis'],
  isCompatible: (sel) => sel.cache === 'redis',
  install: async (ctx) => {
    const templateDir = path.join(import.meta.dirname, 'templates')
    ctx.copyTemplates(path.join(templateDir, 'src'), 'src')

    ctx.addDependencies({
      '@nestjs/bullmq': '^11.0.0',
      bullmq: '^5.0.0',
    })
    ctx.registerModule('QueueModule', './queue/queue.module')
  },
})
