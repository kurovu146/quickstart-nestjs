import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs-extra'
import path from 'path'
import { postgresPlugin } from '../postgres/index.js'
import { mysqlPlugin } from '../mysql/index.js'
import { mongodbPlugin } from '../mongodb/index.js'
import { sqlitePlugin } from '../sqlite/index.js'
import { PluginContextImpl } from '../../core/plugin-context.js'
import type { UserSelections } from '../../core/types.js'

const TEST_DIR = path.join(import.meta.dirname, '.tmp-db-plugins')

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

function createCtx(db: string) {
  return new PluginContextImpl({
    projectName: 'test',
    projectPath: TEST_DIR,
    structure: 'monolith',
    selections: { ...baseSelections, database: db },
  })
}

describe('Database plugins', () => {
  beforeEach(() => fs.ensureDir(TEST_DIR))
  afterEach(() => fs.remove(TEST_DIR))

  it('postgres: should add docker service and env vars', async () => {
    const ctx = createCtx('postgres')
    await postgresPlugin.install(ctx)
    expect(ctx.getDockerServices()).toHaveProperty('postgres')
    expect(ctx.getEnvVars()).toHaveProperty('DATABASE_URL')
    expect(ctx.getEnvVars().DATABASE_URL).toContain('postgresql')
  })

  it('mysql: should add docker service and env vars', async () => {
    const ctx = createCtx('mysql')
    await mysqlPlugin.install(ctx)
    expect(ctx.getDockerServices()).toHaveProperty('mysql')
    expect(ctx.getEnvVars()).toHaveProperty('DATABASE_URL')
    expect(ctx.getEnvVars().DATABASE_URL).toContain('mysql')
  })

  it('mongodb: should add docker service and env vars', async () => {
    const ctx = createCtx('mongodb')
    await mongodbPlugin.install(ctx)
    expect(ctx.getDockerServices()).toHaveProperty('mongodb')
    expect(ctx.getEnvVars()).toHaveProperty('DATABASE_URL')
    expect(ctx.getEnvVars().DATABASE_URL).toContain('mongodb')
  })

  it('sqlite: should add env vars only (no docker)', async () => {
    const ctx = createCtx('sqlite')
    await sqlitePlugin.install(ctx)
    expect(Object.keys(ctx.getDockerServices())).toHaveLength(0)
    expect(ctx.getEnvVars()).toHaveProperty('DATABASE_URL')
  })

  it('postgres: should conflict with other databases', () => {
    expect(postgresPlugin.conflicts).toContain('mysql')
    expect(postgresPlugin.conflicts).toContain('mongodb')
    expect(postgresPlugin.conflicts).toContain('sqlite')
  })
})
