import path from 'path'
import fs from 'fs-extra'
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

    // A monorepo build emits to dist/apps/api/main, not dist/main — fix the
    // entrypoint the Dockerfile starts.
    if (ctx.structure === 'monorepo') {
      const dockerfilePath = path.join(ctx.projectPath, 'Dockerfile')
      if (await fs.pathExists(dockerfilePath)) {
        const content = await fs.readFile(dockerfilePath, 'utf-8')
        await fs.writeFile(
          dockerfilePath,
          content.replace('dist/main', 'dist/apps/api/main'),
          'utf-8',
        )
      }
    }

    ctx.addScripts({
      'db:up': 'docker compose up -d',
      'db:down': 'docker compose down',
      'db:reset': 'docker compose down -v && docker compose up -d',
      'db:logs': 'docker compose logs -f',
    })
  },
})
