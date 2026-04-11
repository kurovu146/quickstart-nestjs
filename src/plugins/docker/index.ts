import path from 'path'
import { definePlugin } from '../../core/types.js'

export const dockerPlugin = definePlugin({
  name: 'docker',
  category: 'infra',
  displayName: 'Docker',
  description: 'Docker containerization support',
  conflicts: [],
  install: async (ctx) => {
    const templateDir = path.join(ctx.pluginsDir, 'docker/templates')
    ctx.copyTemplates(templateDir)
    ctx.addScripts({
      'db:up': 'docker compose up -d',
      'db:down': 'docker compose down',
      'db:reset': 'docker compose down -v && docker compose up -d',
      'db:logs': 'docker compose logs -f',
    })
  },
})
