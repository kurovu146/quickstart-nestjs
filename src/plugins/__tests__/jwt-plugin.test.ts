import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs-extra'
import path from 'path'
import { jwtPlugin } from '../jwt/index.js'
import { PluginContextImpl } from '../../core/plugin-context.js'
import type { UserSelections } from '../../core/types.js'

const TEST_DIR = path.join(import.meta.dirname, '.tmp-jwt-plugin')

const baseSelections: UserSelections = {
  projectName: 'test',
  structure: 'monolith',
  packageManager: 'npm',
  database: 'postgres',
  orm: 'prisma',
  auth: 'jwt',
  cache: null,
  realtime: null,
  docs: null,
  docker: false,
  logger: null,
  queue: null,
  mailer: null,
  upload: null,
}

describe('JWT plugin', () => {
  beforeEach(() => fs.ensureDir(TEST_DIR))
  afterEach(() => fs.remove(TEST_DIR))

  it('should add auth dependencies', async () => {
    const ctx = new PluginContextImpl({
      projectName: 'test',
      projectPath: TEST_DIR,
      structure: 'monolith',
      selections: baseSelections,
      pluginsDir: path.resolve(import.meta.dirname, '..'),
    })
    await jwtPlugin.install(ctx)
    expect(ctx.getDependencies()).toHaveProperty('@nestjs/jwt')
    expect(ctx.getDependencies()).toHaveProperty('@nestjs/passport')
    expect(ctx.getDependencies()).toHaveProperty('passport')
    expect(ctx.getDependencies()).toHaveProperty('passport-jwt')
    expect(ctx.getDependencies()).toHaveProperty('bcrypt')
  })

  it('should add env vars', async () => {
    const ctx = new PluginContextImpl({
      projectName: 'test',
      projectPath: TEST_DIR,
      structure: 'monolith',
      selections: baseSelections,
      pluginsDir: path.resolve(import.meta.dirname, '..'),
    })
    await jwtPlugin.install(ctx)
    expect(ctx.getEnvVars()).toHaveProperty('JWT_SECRET')
    expect(ctx.getEnvVars()).toHaveProperty('JWT_EXPIRES_IN')
  })

  it('should register AuthModule and UsersModule', async () => {
    const ctx = new PluginContextImpl({
      projectName: 'test',
      projectPath: TEST_DIR,
      structure: 'monolith',
      selections: baseSelections,
      pluginsDir: path.resolve(import.meta.dirname, '..'),
    })
    await jwtPlugin.install(ctx)
    const moduleNames = ctx.getModules().map(m => m.moduleName)
    expect(moduleNames).toContain('AuthModule')
    expect(moduleNames).toContain('UsersModule')
  })

  it('should copy template files', async () => {
    const ctx = new PluginContextImpl({
      projectName: 'test',
      projectPath: TEST_DIR,
      structure: 'monolith',
      selections: baseSelections,
      pluginsDir: path.resolve(import.meta.dirname, '..'),
    })
    await jwtPlugin.install(ctx)
    expect(await fs.pathExists(path.join(TEST_DIR, 'src/auth/auth.module.ts'))).toBe(true)
    expect(await fs.pathExists(path.join(TEST_DIR, 'src/auth/auth.service.ts'))).toBe(true)
    expect(await fs.pathExists(path.join(TEST_DIR, 'src/auth/auth.controller.ts'))).toBe(true)
    expect(await fs.pathExists(path.join(TEST_DIR, 'src/auth/guards/jwt-auth.guard.ts'))).toBe(true)
    expect(await fs.pathExists(path.join(TEST_DIR, 'src/auth/strategies/jwt.strategy.ts'))).toBe(true)
    expect(await fs.pathExists(path.join(TEST_DIR, 'src/users/users.module.ts'))).toBe(true)
    expect(await fs.pathExists(path.join(TEST_DIR, 'src/users/users.service.ts'))).toBe(true)
  })

  it('should only be compatible when ORM is selected', () => {
    expect(jwtPlugin.isCompatible!({ ...baseSelections, orm: null })).toBe(false)
    expect(jwtPlugin.isCompatible!({ ...baseSelections, orm: 'prisma' })).toBe(true)
  })
})
