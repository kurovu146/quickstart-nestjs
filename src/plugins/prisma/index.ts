import path from 'path'
import fs from 'fs-extra'
import { definePlugin } from '../../core/types.js'

export const prismaPlugin = definePlugin({
  name: 'prisma',
  category: 'orm',
  displayName: 'Prisma',
  description: 'Type-safe ORM with auto-generated client',
  conflicts: ['typeorm', 'sequelize', 'mongoose'],
  requires: ['postgres', 'mysql', 'sqlite'],
  isCompatible: (sel) => sel.database !== 'mongodb' && sel.database !== null,
  install: async (ctx) => {
    const templateDir = path.join(import.meta.dirname, 'templates')
    ctx.copyTemplates(path.join(templateDir, 'src'), 'src')

    const providerMap: Record<string, string> = {
      postgres: 'postgresql',
      mysql: 'mysql',
      sqlite: 'sqlite',
    }
    const provider = providerMap[ctx.selections.database || 'postgres'] || 'postgresql'

    const schemaContent = `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "${provider}"
  url      = env("DATABASE_URL")
}

model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String?
  password  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
`
    await fs.ensureDir(path.join(ctx.projectPath, 'prisma'))
    await fs.writeFile(path.join(ctx.projectPath, 'prisma/schema.prisma'), schemaContent)

    ctx.addDependencies({ '@prisma/client': '^6.0.0' })
    ctx.addDevDependencies({ prisma: '^6.0.0' })
    ctx.addScripts({
      'db:migrate': 'prisma migrate dev',
      'db:generate': 'prisma generate',
      'db:seed': 'ts-node prisma/seed.ts',
      'db:studio': 'prisma studio',
    })
    ctx.registerModule('PrismaModule', './prisma/prisma.module')
  },
})
