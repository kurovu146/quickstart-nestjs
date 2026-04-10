import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs-extra'
import path from 'path'
import { GeneratorEngine } from '../../src/core/engine.js'
import { PluginRegistry } from '../../src/core/plugin-registry.js'
import { loadAllPlugins } from '../../src/plugins/index.js'
import type { UserSelections } from '../../src/core/types.js'

const TEST_DIR = path.join(import.meta.dirname, '.tmp-e2e')

const fullSelections: UserSelections = {
  projectName: 'e2e-test-project',
  structure: 'monolith',
  packageManager: 'npm',
  database: 'postgres',
  orm: 'prisma',
  auth: 'jwt',
  cache: 'redis',
  realtime: 'socket-io',
  docs: 'swagger',
  docker: true,
  logger: 'pino',
  queue: 'bullmq',
  mailer: 'mailer',
  upload: 'upload-s3',
}

describe('E2E: Full project generation', () => {
  let registry: PluginRegistry

  beforeEach(async () => {
    await fs.ensureDir(TEST_DIR)
    registry = new PluginRegistry()
    loadAllPlugins(registry)
  })

  afterEach(async () => {
    await fs.remove(TEST_DIR)
  })

  it('should generate a complete monolith project with all plugins', async () => {
    const selectedPlugins = [
      'postgres', 'prisma', 'jwt', 'redis', 'socket-io',
      'swagger', 'docker', 'pino', 'bullmq', 'mailer', 'upload-s3',
    ]

    const engine = new GeneratorEngine(registry)
    const projectPath = await engine.generate({
      outputDir: TEST_DIR,
      selections: fullSelections,
      skeletonsDir: path.resolve(import.meta.dirname, '../../src/skeletons'),
      selectedPlugins,
      skipInstall: true,
      skipGit: true,
      skipFormat: true,
    })

    // Verify core structure
    expect(await fs.pathExists(path.join(projectPath, 'src/main.ts'))).toBe(true)
    expect(await fs.pathExists(path.join(projectPath, 'src/app.module.ts'))).toBe(true)
    expect(await fs.pathExists(path.join(projectPath, 'package.json'))).toBe(true)

    // Verify plugin files
    expect(await fs.pathExists(path.join(projectPath, 'src/prisma/prisma.module.ts'))).toBe(true)
    expect(await fs.pathExists(path.join(projectPath, 'src/prisma/prisma.service.ts'))).toBe(true)
    expect(await fs.pathExists(path.join(projectPath, 'src/auth/auth.module.ts'))).toBe(true)
    expect(await fs.pathExists(path.join(projectPath, 'src/auth/auth.controller.ts'))).toBe(true)
    expect(await fs.pathExists(path.join(projectPath, 'src/auth/guards/jwt-auth.guard.ts'))).toBe(true)
    expect(await fs.pathExists(path.join(projectPath, 'src/users/users.module.ts'))).toBe(true)
    expect(await fs.pathExists(path.join(projectPath, 'src/cache/cache.module.ts'))).toBe(true)
    expect(await fs.pathExists(path.join(projectPath, 'src/gateway/app.gateway.ts'))).toBe(true)
    expect(await fs.pathExists(path.join(projectPath, 'src/upload/upload.module.ts'))).toBe(true)
    expect(await fs.pathExists(path.join(projectPath, 'prisma/schema.prisma'))).toBe(true)
    expect(await fs.pathExists(path.join(projectPath, 'Dockerfile'))).toBe(true)
    expect(await fs.pathExists(path.join(projectPath, '.dockerignore'))).toBe(true)
    expect(await fs.pathExists(path.join(projectPath, 'docker-compose.yml'))).toBe(true)
    expect(await fs.pathExists(path.join(projectPath, '.env.example'))).toBe(true)

    // Verify package.json has all deps
    const pkg = await fs.readJSON(path.join(projectPath, 'package.json'))
    expect(pkg.name).toBe('e2e-test-project')
    expect(pkg.dependencies['@prisma/client']).toBeDefined()
    expect(pkg.dependencies['@nestjs/jwt']).toBeDefined()
    expect(pkg.dependencies['@nestjs/cache-manager']).toBeDefined()
    expect(pkg.dependencies['@nestjs/websockets']).toBeDefined()
    expect(pkg.dependencies['@nestjs/swagger']).toBeDefined()
    expect(pkg.dependencies['nestjs-pino']).toBeDefined()
    expect(pkg.dependencies['@nestjs/bullmq']).toBeDefined()
    expect(pkg.dependencies['@nestjs-modules/mailer']).toBeDefined()
    expect(pkg.dependencies['@aws-sdk/client-s3']).toBeDefined()

    // Verify app.module.ts has wired modules
    const appModule = await fs.readFile(path.join(projectPath, 'src/app.module.ts'), 'utf-8')
    expect(appModule).toContain('PrismaModule')
    expect(appModule).toContain('AuthModule')
    expect(appModule).toContain('UsersModule')
    expect(appModule).toContain('CacheModule')
    expect(appModule).toContain('GatewayModule')

    // Verify .env.example has all vars
    const envContent = await fs.readFile(path.join(projectPath, '.env.example'), 'utf-8')
    expect(envContent).toContain('DATABASE_URL')
    expect(envContent).toContain('JWT_SECRET')
    expect(envContent).toContain('REDIS_HOST')
    expect(envContent).toContain('MAIL_HOST')
    expect(envContent).toContain('AWS_S3_BUCKET')

    // Verify docker-compose has services
    const dockerCompose = await fs.readFile(path.join(projectPath, 'docker-compose.yml'), 'utf-8')
    expect(dockerCompose).toContain('postgres')
    expect(dockerCompose).toContain('redis')
  })

  it('should generate a minimal project with no plugins', async () => {
    const minimalSelections: UserSelections = {
      projectName: 'minimal-project',
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

    const engine = new GeneratorEngine(registry)
    const projectPath = await engine.generate({
      outputDir: TEST_DIR,
      selections: minimalSelections,
      skeletonsDir: path.resolve(import.meta.dirname, '../../src/skeletons'),
      selectedPlugins: [],
      skipInstall: true,
      skipGit: true,
      skipFormat: true,
    })

    expect(await fs.pathExists(path.join(projectPath, 'src/main.ts'))).toBe(true)
    expect(await fs.pathExists(path.join(projectPath, 'package.json'))).toBe(true)
    expect(await fs.pathExists(path.join(projectPath, 'src/app.module.ts'))).toBe(true)

    // Should NOT have plugin files
    expect(await fs.pathExists(path.join(projectPath, 'src/prisma'))).toBe(false)
    expect(await fs.pathExists(path.join(projectPath, 'docker-compose.yml'))).toBe(false)
  })

  it('should generate a monorepo project', async () => {
    const monorepoSelections: UserSelections = {
      projectName: 'monorepo-project',
      structure: 'monorepo',
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

    const engine = new GeneratorEngine(registry)
    const projectPath = await engine.generate({
      outputDir: TEST_DIR,
      selections: monorepoSelections,
      skeletonsDir: path.resolve(import.meta.dirname, '../../src/skeletons'),
      selectedPlugins: ['postgres', 'prisma'],
      skipInstall: true,
      skipGit: true,
      skipFormat: true,
    })

    expect(await fs.pathExists(path.join(projectPath, 'apps/api/src/main.ts'))).toBe(true)
    expect(await fs.pathExists(path.join(projectPath, 'apps/api/src/app.module.ts'))).toBe(true)
    expect(await fs.pathExists(path.join(projectPath, 'nest-cli.json'))).toBe(true)

    // Verify module wiring in monorepo path
    const appModule = await fs.readFile(path.join(projectPath, 'apps/api/src/app.module.ts'), 'utf-8')
    expect(appModule).toContain('PrismaModule')
  })
})
