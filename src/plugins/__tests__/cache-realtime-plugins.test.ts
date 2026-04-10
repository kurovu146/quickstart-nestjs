import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs-extra'
import path from 'path'
import { redisPlugin } from '../redis/index.js'
import { socketIoPlugin } from '../socket-io/index.js'
import { websocketPlugin } from '../websocket/index.js'
import { PluginContextImpl } from '../../core/plugin-context.js'
import type { UserSelections } from '../../core/types.js'

const TEST_DIR = path.join(import.meta.dirname, '.tmp-cache-rt')

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

describe('Cache & Realtime plugins', () => {
  beforeEach(() => fs.ensureDir(TEST_DIR))
  afterEach(() => fs.remove(TEST_DIR))

  it('redis: should add deps, env vars, docker service, and module', async () => {
    const ctx = createCtx({ cache: 'redis' })
    await redisPlugin.install(ctx)
    expect(ctx.getDependencies()).toHaveProperty('@nestjs/cache-manager')
    expect(ctx.getEnvVars()).toHaveProperty('REDIS_HOST')
    expect(ctx.getEnvVars()).toHaveProperty('REDIS_PORT')
    expect(ctx.getDockerServices()).toHaveProperty('redis')
    expect(ctx.getModules()).toContainEqual(expect.objectContaining({ moduleName: 'CacheModule' }))
    expect(await fs.pathExists(path.join(TEST_DIR, 'src/cache/cache.module.ts'))).toBe(true)
  })

  it('socket-io: should add deps and module', async () => {
    const ctx = createCtx({ realtime: 'socket-io' })
    await socketIoPlugin.install(ctx)
    expect(ctx.getDependencies()).toHaveProperty('@nestjs/websockets')
    expect(ctx.getDependencies()).toHaveProperty('@nestjs/platform-socket.io')
    expect(ctx.getModules()).toContainEqual(expect.objectContaining({ moduleName: 'GatewayModule' }))
    expect(await fs.pathExists(path.join(TEST_DIR, 'src/gateway/app.gateway.ts'))).toBe(true)
    expect(await fs.pathExists(path.join(TEST_DIR, 'src/gateway/gateway.module.ts'))).toBe(true)
  })

  it('websocket: should add deps and module', async () => {
    const ctx = createCtx({ realtime: 'websocket' })
    await websocketPlugin.install(ctx)
    expect(ctx.getDependencies()).toHaveProperty('@nestjs/websockets')
    expect(ctx.getDependencies()).toHaveProperty('@nestjs/platform-ws')
    expect(ctx.getModules()).toContainEqual(expect.objectContaining({ moduleName: 'GatewayModule' }))
    expect(await fs.pathExists(path.join(TEST_DIR, 'src/gateway/app.gateway.ts'))).toBe(true)
  })

  it('socket-io and websocket should conflict', () => {
    expect(socketIoPlugin.conflicts).toContain('websocket')
    expect(websocketPlugin.conflicts).toContain('socket-io')
  })
})
