// src/core/__tests__/plugin-registry.test.ts
import { describe, it, expect } from 'vitest'
import { PluginRegistry } from '../plugin-registry.js'
import type { UserSelections } from '../types.js'
import { definePlugin } from '../types.js'

const mockSelections: UserSelections = {
  projectName: 'test',
  structure: 'monolith',
  packageManager: 'npm',
  database: 'postgres',
  orm: 'prisma',
  auth: 'jwt',
  cache: 'redis',
  realtime: null,
  docs: null,
  docker: false,
  logger: null,
  queue: null,
  mailer: null,
  upload: null,
}

const postgresPlugin = definePlugin({
  name: 'postgres',
  category: 'database',
  displayName: 'PostgreSQL',
  description: 'PostgreSQL database',
  conflicts: ['mysql', 'mongodb', 'sqlite'],
  install: async () => {},
})

const prismaPlugin = definePlugin({
  name: 'prisma',
  category: 'orm',
  displayName: 'Prisma',
  description: 'Prisma ORM',
  conflicts: ['typeorm', 'sequelize', 'mongoose'],
  requires: ['postgres', 'mysql', 'sqlite'],
  isCompatible: (sel) => sel.database !== 'mongodb',
  install: async () => {},
})

const jwtPlugin = definePlugin({
  name: 'jwt',
  category: 'auth',
  displayName: 'JWT',
  description: 'JWT authentication',
  requires: ['prisma', 'typeorm', 'sequelize', 'mongoose'],
  install: async () => {},
})

const mongoosePlugin = definePlugin({
  name: 'mongoose',
  category: 'orm',
  displayName: 'Mongoose',
  description: 'Mongoose ODM',
  conflicts: ['prisma', 'typeorm', 'sequelize'],
  requires: ['mongodb'],
  install: async () => {},
})

describe('PluginRegistry', () => {
  it('should register plugins', () => {
    const registry = new PluginRegistry()
    registry.register(postgresPlugin)
    registry.register(prismaPlugin)
    expect(registry.getAll()).toHaveLength(2)
  })

  it('should get plugins by category', () => {
    const registry = new PluginRegistry()
    registry.register(postgresPlugin)
    registry.register(prismaPlugin)
    expect(registry.getByCategory('database')).toHaveLength(1)
    expect(registry.getByCategory('orm')).toHaveLength(1)
  })

  it('should filter compatible plugins based on selections', () => {
    const registry = new PluginRegistry()
    registry.register(prismaPlugin)
    registry.register(mongoosePlugin)
    const mongoSelections = { ...mockSelections, database: 'mongodb' }
    const compatible = registry.getCompatible('orm', mongoSelections)
    expect(compatible.map((p) => p.name)).not.toContain('prisma')
    expect(compatible.map((p) => p.name)).toContain('mongoose')
  })

  it('should resolve install order respecting dependencies', () => {
    const registry = new PluginRegistry()
    registry.register(jwtPlugin)
    registry.register(prismaPlugin)
    registry.register(postgresPlugin)
    const selected = ['postgres', 'prisma', 'jwt']
    const ordered = registry.resolveInstallOrder(selected)
    const pgIdx = ordered.indexOf('postgres')
    const prismaIdx = ordered.indexOf('prisma')
    const jwtIdx = ordered.indexOf('jwt')
    expect(pgIdx).toBeLessThan(prismaIdx)
    expect(prismaIdx).toBeLessThan(jwtIdx)
  })

  it('should detect conflicts', () => {
    const registry = new PluginRegistry()
    registry.register(prismaPlugin)
    registry.register(mongoosePlugin)
    const conflicts = registry.findConflicts(['prisma', 'mongoose'])
    expect(conflicts).toHaveLength(1)
    expect(conflicts[0]).toContain('prisma')
    expect(conflicts[0]).toContain('mongoose')
  })
})
