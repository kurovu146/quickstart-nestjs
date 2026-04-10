// src/core/__tests__/plugin-context.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs-extra'
import path from 'path'
import { PluginContextImpl } from '../plugin-context.js'
import type { UserSelections } from '../types.js'

const TEST_DIR = path.join(import.meta.dirname, '.tmp-plugin-ctx-test')

const baseSelections: UserSelections = {
  projectName: 'test-project',
  structure: 'monolith',
  packageManager: 'npm',
  database: 'postgres',
  orm: 'prisma',
  auth: null,
  cache: null,
  realtime: null,
  docs: null,
  docker: false,
  logger: null,
  queue: null,
  mailer: null,
  upload: null,
}

describe('PluginContextImpl', () => {
  let ctx: PluginContextImpl

  beforeEach(async () => {
    await fs.ensureDir(TEST_DIR)
    ctx = new PluginContextImpl({
      projectName: 'test-project',
      projectPath: TEST_DIR,
      structure: 'monolith',
      selections: baseSelections,
    })
  })

  afterEach(async () => {
    await fs.remove(TEST_DIR)
  })

  it('should copy templates to project path', async () => {
    const srcDir = path.join(TEST_DIR, '_templates')
    await fs.ensureDir(path.join(srcDir, 'src/prisma'))
    await fs.writeFile(path.join(srcDir, 'src/prisma/prisma.module.ts'), 'module code')

    ctx.copyTemplates(srcDir)

    expect(await fs.pathExists(path.join(TEST_DIR, 'src/prisma/prisma.module.ts'))).toBe(true)
  })

  it('should collect dependencies', () => {
    ctx.addDependencies({ '@prisma/client': '^6.0.0' })
    ctx.addDependencies({ 'rxjs': '^7.0.0' })

    expect(ctx.getDependencies()).toEqual({
      '@prisma/client': '^6.0.0',
      rxjs: '^7.0.0',
    })
  })

  it('should collect dev dependencies', () => {
    ctx.addDevDependencies({ prisma: '^6.0.0' })

    expect(ctx.getDevDependencies()).toEqual({ prisma: '^6.0.0' })
  })

  it('should collect scripts', () => {
    ctx.addScripts({ 'db:migrate': 'prisma migrate dev' })

    expect(ctx.getScripts()).toEqual({ 'db:migrate': 'prisma migrate dev' })
  })

  it('should collect module registrations', () => {
    ctx.registerModule('PrismaModule', './prisma/prisma.module')

    expect(ctx.getModules()).toEqual([
      { moduleName: 'PrismaModule', importPath: './prisma/prisma.module' },
    ])
  })

  it('should collect env vars', () => {
    ctx.addEnvVars({ DATABASE_URL: 'postgresql://localhost:5432/db' })

    expect(ctx.getEnvVars()).toEqual({ DATABASE_URL: 'postgresql://localhost:5432/db' })
  })

  it('should collect docker services', () => {
    ctx.addDockerService('postgres', {
      image: 'postgres:16-alpine',
      ports: ['5432:5432'],
      environment: { POSTGRES_DB: 'mydb' },
    })

    expect(ctx.getDockerServices()).toHaveProperty('postgres')
    expect(ctx.getDockerServices().postgres.image).toBe('postgres:16-alpine')
  })
})
