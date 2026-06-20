import path from 'path'
import fs from 'fs-extra'
import { definePlugin } from '../../core/types.js'

const SWAGGER_IMPORT = "import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';"

const SWAGGER_SETUP = `
  const swaggerConfig = new DocumentBuilder()
    .setTitle('API')
    .setDescription('API documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, swaggerDocument);
`

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

    // Wire Swagger into the app's bootstrap so the docs are actually served at
    // /api. Without this the dependency would be installed but never used.
    const mainPath = path.join(
      ctx.projectPath,
      ctx.structure === 'monorepo' ? 'apps/api/src/main.ts' : 'src/main.ts',
    )
    if (!(await fs.pathExists(mainPath))) return

    let source = await fs.readFile(mainPath, 'utf-8')
    if (source.includes('SwaggerModule')) return // already wired — stay idempotent

    if (source.includes("from './app.module'")) {
      source = source.replace(
        /(import \{ AppModule \} from '\.\/app\.module';)/,
        `$1\n${SWAGGER_IMPORT}`,
      )
    } else {
      source = `${SWAGGER_IMPORT}\n${source}`
    }

    // Insert the setup right before the server starts listening.
    source = source.replace(/(\n[ \t]*await app\.listen\()/, `${SWAGGER_SETUP}$1`)

    await fs.writeFile(mainPath, source, 'utf-8')
  },
})
