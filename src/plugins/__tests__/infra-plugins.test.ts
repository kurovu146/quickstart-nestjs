import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs-extra'
import path from 'path'
import { swaggerPlugin } from '../swagger/index.js'
import { dockerPlugin } from '../docker/index.js'
import { pinoPlugin } from '../pino/index.js'
import { winstonPlugin } from '../winston/index.js'
import { PluginContextImpl } from '../../core/plugin-context.js'
import type { UserSelections } from '../../core/types.js'

const TEST_DIR = path.join(import.meta.dirname, '.tmp-infra-plugins')

const baseSelections: UserSelections = {
  projectName: 'test',
  structure: 'monolith',
  packageManager: 'npm',
  database: null,
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

function createCtx(overrides: Partial<UserSelections> = {}) {
  return new PluginContextImpl({
    projectName: 'test',
    projectPath: TEST_DIR,
    structure: 'monolith',
    selections: { ...baseSelections, ...overrides },
  })
}

describe('Infrastructure plugins', () => {
  beforeEach(() => fs.ensureDir(TEST_DIR))
  afterEach(() => fs.remove(TEST_DIR))

  it('swagger: should add deps', async () => {
    const ctx = createCtx({ docs: 'swagger' })
    await swaggerPlugin.install(ctx)
    expect(ctx.getDependencies()).toHaveProperty('@nestjs/swagger')
  })

  it('docker: should copy Dockerfile and .dockerignore', async () => {
    const ctx = createCtx({ docker: true })
    await dockerPlugin.install(ctx)
    expect(await fs.pathExists(path.join(TEST_DIR, 'Dockerfile'))).toBe(true)
    expect(await fs.pathExists(path.join(TEST_DIR, '.dockerignore'))).toBe(true)
  })

  it('pino: should add deps and register module', async () => {
    const ctx = createCtx({ logger: 'pino' })
    await pinoPlugin.install(ctx)
    expect(ctx.getDependencies()).toHaveProperty('nestjs-pino')
    expect(ctx.getDependencies()).toHaveProperty('pino-http')
    expect(ctx.getModules()).toContainEqual(expect.objectContaining({ moduleName: 'LoggerModule' }))
  })

  it('winston: should add deps and register module', async () => {
    const ctx = createCtx({ logger: 'winston' })
    await winstonPlugin.install(ctx)
    expect(ctx.getDependencies()).toHaveProperty('nest-winston')
    expect(ctx.getDependencies()).toHaveProperty('winston')
    expect(ctx.getModules()).toContainEqual(expect.objectContaining({ moduleName: 'LoggerModule' }))
  })

  it('pino and winston should conflict', () => {
    expect(pinoPlugin.conflicts).toContain('winston')
    expect(winstonPlugin.conflicts).toContain('pino')
  })
})
