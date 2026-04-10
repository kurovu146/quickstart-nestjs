import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs-extra'
import path from 'path'
import { prismaPlugin } from '../prisma/index.js'
import { typeormPlugin } from '../typeorm/index.js'
import { sequelizePlugin } from '../sequelize/index.js'
import { mongoosePlugin } from '../mongoose/index.js'
import { PluginContextImpl } from '../../core/plugin-context.js'
import type { UserSelections } from '../../core/types.js'

const TEST_DIR = path.join(import.meta.dirname, '.tmp-orm-plugins')

const baseSelections: UserSelections = {
  projectName: 'test',
  structure: 'monolith',
  packageManager: 'npm',
  database: 'postgres',
  orm: null,
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

describe('ORM plugins', () => {
  beforeEach(() => fs.ensureDir(TEST_DIR))
  afterEach(() => fs.remove(TEST_DIR))

  it('prisma: should add deps, scripts, module, and template files', async () => {
    const ctx = new PluginContextImpl({
      projectName: 'test',
      projectPath: TEST_DIR,
      structure: 'monolith',
      selections: { ...baseSelections, orm: 'prisma' },
      pluginsDir: path.resolve(import.meta.dirname, '..'),
    })
    await prismaPlugin.install(ctx)
    expect(ctx.getDependencies()).toHaveProperty('@prisma/client')
    expect(ctx.getDevDependencies()).toHaveProperty('prisma')
    expect(ctx.getScripts()).toHaveProperty('db:migrate')
    expect(ctx.getModules()).toContainEqual(
      expect.objectContaining({ moduleName: 'PrismaModule' }),
    )
    expect(await fs.pathExists(path.join(TEST_DIR, 'src/prisma/prisma.module.ts'))).toBe(true)
    expect(await fs.pathExists(path.join(TEST_DIR, 'prisma/schema.prisma'))).toBe(true)
  })

  it('prisma: should not be compatible with mongodb', () => {
    const mongoSel = { ...baseSelections, database: 'mongodb' }
    expect(prismaPlugin.isCompatible!(mongoSel)).toBe(false)
  })

  it('typeorm: should add deps and module', async () => {
    const ctx = new PluginContextImpl({
      projectName: 'test',
      projectPath: TEST_DIR,
      structure: 'monolith',
      selections: { ...baseSelections, orm: 'typeorm' },
      pluginsDir: path.resolve(import.meta.dirname, '..'),
    })
    await typeormPlugin.install(ctx)
    expect(ctx.getDependencies()).toHaveProperty('typeorm')
    expect(ctx.getDependencies()).toHaveProperty('@nestjs/typeorm')
    expect(ctx.getModules()).toContainEqual(
      expect.objectContaining({ moduleName: 'DatabaseModule' }),
    )
  })

  it('mongoose: should require mongodb', () => {
    expect(mongoosePlugin.requires).toContain('mongodb')
  })

  it('mongoose: should add deps and module', async () => {
    const ctx = new PluginContextImpl({
      projectName: 'test',
      projectPath: TEST_DIR,
      structure: 'monolith',
      selections: { ...baseSelections, database: 'mongodb', orm: 'mongoose' },
      pluginsDir: path.resolve(import.meta.dirname, '..'),
    })
    await mongoosePlugin.install(ctx)
    expect(ctx.getDependencies()).toHaveProperty('@nestjs/mongoose')
    expect(ctx.getDependencies()).toHaveProperty('mongoose')
  })
})
