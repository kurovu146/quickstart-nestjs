import path from 'path'
import { definePlugin } from '../../core/types.js'

export const dockerPlugin = definePlugin({
  name: 'docker',
  category: 'infra',
  displayName: 'Docker',
  description: 'Docker containerization support',
  conflicts: [],
  install: async (ctx) => {
    const templateDir = path.join(import.meta.dirname, 'templates')
    ctx.copyTemplates(templateDir)
  },
})
