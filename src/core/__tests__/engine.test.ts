// src/core/__tests__/engine.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs-extra'
import path from 'path'
import { GeneratorEngine } from '../engine.js'
import { PluginRegistry } from '../plugin-registry.js'
import { definePlugin } from '../types.js'
import type { UserSelections } from '../types.js'

const TEST_DIR = path.join(import.meta.dirname, '.tmp-engine-test')
const PROJECT_DIR = path.join(TEST_DIR, 'my-project')

const selections: UserSelections = {
  projectName: 'my-project',
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

describe('GeneratorEngine', () => {
  let registry: PluginRegistry

  beforeEach(async () => {
    await fs.ensureDir(TEST_DIR)
    registry = new PluginRegistry()
  })

  afterEach(async () => {
    await fs.remove(TEST_DIR)
  })

  it('should create project directory and copy skeleton', async () => {
    const engine = new GeneratorEngine(registry)

    await engine.generate({
      outputDir: TEST_DIR,
      selections,
      skeletonsDir: path.join(import.meta.dirname, '../../skeletons'),
      skipInstall: true,
      skipGit: true,
      skipFormat: true,
    })

    expect(await fs.pathExists(PROJECT_DIR)).toBe(true)
    expect(await fs.pathExists(path.join(PROJECT_DIR, 'src/main.ts'))).toBe(true)
    expect(await fs.pathExists(path.join(PROJECT_DIR, 'src/app.module.ts'))).toBe(true)
  })

  it('should generate package.json with project name', async () => {
    const engine = new GeneratorEngine(registry)

    await engine.generate({
      outputDir: TEST_DIR,
      selections,
      skeletonsDir: path.join(import.meta.dirname, '../../skeletons'),
      skipInstall: true,
      skipGit: true,
      skipFormat: true,
    })

    const pkg = await fs.readJSON(path.join(PROJECT_DIR, 'package.json'))
    expect(pkg.name).toBe('my-project')
  })

  it('should run plugin install and merge dependencies', async () => {
    const testPlugin = definePlugin({
      name: 'postgres',
      category: 'database',
      displayName: 'PostgreSQL',
      description: 'PostgreSQL',
      install: async (ctx) => {
        ctx.addDependencies({ pg: '^8.0.0' })
        ctx.addEnvVars({ DATABASE_URL: 'postgresql://localhost:5432/db' })
      },
    })
    registry.register(testPlugin)

    const engine = new GeneratorEngine(registry)

    await engine.generate({
      outputDir: TEST_DIR,
      selections: { ...selections, database: 'postgres' },
      skeletonsDir: path.join(import.meta.dirname, '../../skeletons'),
      selectedPlugins: ['postgres'],
      skipInstall: true,
      skipGit: true,
      skipFormat: true,
    })

    const pkg = await fs.readJSON(path.join(PROJECT_DIR, 'package.json'))
    expect(pkg.dependencies.pg).toBe('^8.0.0')

    const envContent = await fs.readFile(path.join(PROJECT_DIR, '.env.example'), 'utf-8')
    expect(envContent).toContain('DATABASE_URL=')
  })

  it('should wire modules into app.module.ts', async () => {
    const testPlugin = definePlugin({
      name: 'postgres',
      category: 'database',
      displayName: 'PostgreSQL',
      description: 'PostgreSQL',
      install: async (ctx) => {
        ctx.registerModule('DatabaseModule', './database/database.module')
      },
    })
    registry.register(testPlugin)

    const engine = new GeneratorEngine(registry)

    await engine.generate({
      outputDir: TEST_DIR,
      selections: { ...selections, database: 'postgres' },
      skeletonsDir: path.join(import.meta.dirname, '../../skeletons'),
      selectedPlugins: ['postgres'],
      skipInstall: true,
      skipGit: true,
      skipFormat: true,
    })

    const appModule = await fs.readFile(path.join(PROJECT_DIR, 'src/app.module.ts'), 'utf-8')
    expect(appModule).toContain('DatabaseModule')
    expect(appModule).toContain('./database/database.module')
  })

  it('should generate a .gitignore that excludes .env and node_modules', async () => {
    const engine = new GeneratorEngine(registry)

    await engine.generate({
      outputDir: TEST_DIR,
      selections,
      skeletonsDir: path.join(import.meta.dirname, '../../skeletons'),
      skipInstall: true,
      skipGit: true,
      skipFormat: true,
    })

    const gitignorePath = path.join(PROJECT_DIR, '.gitignore')
    expect(await fs.pathExists(gitignorePath)).toBe(true)

    const gitignore = await fs.readFile(gitignorePath, 'utf-8')
    const lines = gitignore.split('\n').map((l) => l.trim())
    expect(lines).toContain('.env')
    expect(lines).toContain('node_modules/')
    expect(lines).toContain('dist/')
  })

  it('should reject a project name that escapes the output directory', async () => {
    const engine = new GeneratorEngine(registry)

    await expect(
      engine.generate({
        outputDir: TEST_DIR,
        selections: { ...selections, projectName: '../evil' },
        skeletonsDir: path.join(import.meta.dirname, '../../skeletons'),
        skipInstall: true,
        skipGit: true,
        skipFormat: true,
      }),
    ).rejects.toThrow(/invalid project name/i)

    // The traversal target must not have been created/removed.
    expect(await fs.pathExists(path.join(TEST_DIR, '../evil'))).toBe(false)
  })
})
