import path from 'path'
import { definePlugin } from '../../core/types.js'

export const websocketPlugin = definePlugin({
  name: 'websocket',
  category: 'realtime',
  displayName: 'WebSocket',
  description: 'Native WebSocket protocol support',
  conflicts: ['socket-io'],
  install: async (ctx) => {
    const templateDir = path.join(import.meta.dirname, 'templates')
    ctx.copyTemplates(path.join(templateDir, 'src'), 'src')

    ctx.addDependencies({
      '@nestjs/websockets': '^11.0.0',
      '@nestjs/platform-ws': '^11.0.0',
      ws: '^8.18.0',
    })
    ctx.addDevDependencies({
      '@types/ws': '^8.5.0',
    })
    ctx.registerModule('GatewayModule', './gateway/gateway.module')
  },
})
