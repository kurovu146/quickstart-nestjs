import { definePlugin } from '../../core/types.js'

export const swaggerPlugin = definePlugin({
  name: 'swagger',
  category: 'docs',
  displayName: 'Swagger',
  description: 'OpenAPI documentation with Swagger UI',
  conflicts: [],
  install: async (ctx) => {
    ctx.addDependencies({
      '@nestjs/swagger': '^11.0.0',
    })
    // Swagger setup is done in main.ts — plugin adds a setup snippet
    // The user can customize it after generation
  },
})
