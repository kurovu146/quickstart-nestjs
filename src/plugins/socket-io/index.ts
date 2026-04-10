import path from 'path'
import { definePlugin } from '../../core/types.js'

export const socketIoPlugin = definePlugin({
  name: 'socket-io',
  category: 'realtime',
  displayName: 'Socket.io',
  description: 'Real-time bidirectional event-based communication',
  conflicts: ['websocket'],
  install: async (ctx) => {
    const templateDir = path.join(ctx.pluginsDir, 'socket-io/templates')
    ctx.copyTemplates(path.join(templateDir, 'src'), 'src')

    ctx.addDependencies({
      '@nestjs/websockets': '^11.0.0',
      '@nestjs/platform-socket.io': '^11.0.0',
      'socket.io': '^4.8.0',
    })
    ctx.registerModule('GatewayModule', './gateway/gateway.module')
  },
})
