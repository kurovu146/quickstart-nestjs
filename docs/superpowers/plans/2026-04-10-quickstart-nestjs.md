# quickstart-nestjs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a CLI tool that scaffolds production-ready NestJS projects via interactive prompts with a plugin-based architecture.

**Architecture:** Plugin system where each service (postgres, prisma, jwt, etc.) is a self-contained plugin with templates + install logic. A generator engine orchestrates skeleton creation, plugin installation in dependency order, module wiring, and project finalization.

**Tech Stack:** Node.js, TypeScript, Commander.js, Inquirer.js, EJS, fs-extra, chalk, ora, tsup, Vitest

---

## Phase 1: Project Setup & Core System

### Task 1: Project Initialization

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tsup.config.ts`
- Create: `vitest.config.ts`
- Create: `.gitignore`
- Create: `.prettierrc`

- [ ] **Step 1: Initialize project**

```bash
cd /Users/kuro/Dev/quickstart-nestjs
npm init -y
```

- [ ] **Step 2: Install dependencies**

```bash
npm install commander inquirer chalk ora fs-extra ejs
npm install -D typescript @types/node @types/fs-extra @types/ejs @types/inquirer tsup vitest prettier
```

- [ ] **Step 3: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "bundler",
    "lib": ["ES2022"],
    "outDir": "dist",
    "rootDir": ".",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*", "bin/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

- [ ] **Step 4: Create tsup.config.ts**

```ts
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['bin/cli.ts'],
  format: ['esm'],
  target: 'node18',
  outDir: 'dist',
  clean: true,
  sourcemap: true,
  dts: false,
  banner: {
    js: '#!/usr/bin/env node',
  },
})
```

- [ ] **Step 5: Create vitest.config.ts**

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    root: '.',
  },
})
```

- [ ] **Step 6: Update package.json**

Update `package.json` with these fields:

```json
{
  "name": "quickstart-nestjs",
  "version": "0.1.0",
  "description": "Scaffold production-ready NestJS projects with interactive prompts",
  "type": "module",
  "bin": {
    "quickstart-nestjs": "./dist/cli.js"
  },
  "files": ["dist", "src/skeletons", "src/plugins"],
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "prettier --check .",
    "format": "prettier --write ."
  },
  "keywords": ["nestjs", "scaffold", "cli", "boilerplate", "starter"],
  "license": "MIT",
  "engines": {
    "node": ">=18"
  }
}
```

- [ ] **Step 7: Create .gitignore**

```
node_modules/
dist/
*.tgz
.env
```

- [ ] **Step 8: Create .prettierrc**

```json
{
  "semi": false,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100
}
```

- [ ] **Step 9: Commit**

```bash
git add package.json tsconfig.json tsup.config.ts vitest.config.ts .gitignore .prettierrc package-lock.json
git commit -m "chore: initialize project with typescript, tsup, vitest"
```

---

### Task 2: Core Types

**Files:**
- Create: `src/core/types.ts`

- [ ] **Step 1: Create types.ts with all shared interfaces**

```ts
// src/core/types.ts

export type ProjectStructure = 'monolith' | 'monorepo'

export type PackageManager = 'npm' | 'yarn' | 'pnpm' | 'bun'

export type PluginCategory =
  | 'database'
  | 'orm'
  | 'auth'
  | 'cache'
  | 'realtime'
  | 'docs'
  | 'infra'
  | 'logger'
  | 'queue'
  | 'mailer'
  | 'upload'

export interface UserSelections {
  projectName: string
  structure: ProjectStructure
  packageManager: PackageManager
  database: string | null
  orm: string | null
  auth: string | null
  cache: string | null
  realtime: string | null
  docs: string | null
  docker: boolean
  logger: string | null
  queue: string | null
  mailer: string | null
  upload: string | null
}

export interface PromptQuestion {
  type: 'list' | 'confirm' | 'input'
  name: string
  message: string
  choices?: { name: string; value: string }[]
  default?: string | boolean
}

export interface DockerServiceConfig {
  image: string
  ports?: string[]
  environment?: Record<string, string>
  volumes?: string[]
  restart?: string
}

export interface ModuleRegistration {
  moduleName: string
  importPath: string
  isGlobal?: boolean
}

export interface PluginContext {
  projectName: string
  projectPath: string
  structure: ProjectStructure
  selections: UserSelections

  copyTemplates(source: string, dest?: string): void
  renderTemplate(source: string, dest: string, data: Record<string, unknown>): void

  addDependencies(deps: Record<string, string>): void
  addDevDependencies(deps: Record<string, string>): void
  addScripts(scripts: Record<string, string>): void

  registerModule(moduleName: string, importPath: string): void
  registerProvider(providerName: string, importPath: string): void

  addEnvVars(vars: Record<string, string>): void
  addDockerService(name: string, config: DockerServiceConfig): void
}

export interface PluginDefinition {
  name: string
  category: PluginCategory
  displayName: string
  description: string
  conflicts?: string[]
  requires?: string[]
  optionalDeps?: string[]
  isCompatible?: (selections: UserSelections) => boolean
  prompts?: (selections: UserSelections) => PromptQuestion[]
  install: (ctx: PluginContext) => Promise<void>
}

export function definePlugin(def: PluginDefinition): PluginDefinition {
  return def
}
```

- [ ] **Step 2: Commit**

```bash
git add src/core/types.ts
git commit -m "feat: add core type definitions and interfaces"
```

---

### Task 3: Template Renderer

**Files:**
- Create: `src/core/template-renderer.ts`
- Create: `src/core/__tests__/template-renderer.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/core/__tests__/template-renderer.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs-extra'
import path from 'path'
import { TemplateRenderer } from '../template-renderer.js'

const TEST_DIR = path.join(import.meta.dirname, '.tmp-template-test')

describe('TemplateRenderer', () => {
  let renderer: TemplateRenderer

  beforeEach(async () => {
    renderer = new TemplateRenderer()
    await fs.ensureDir(TEST_DIR)
  })

  afterEach(async () => {
    await fs.remove(TEST_DIR)
  })

  it('should copy a directory recursively', async () => {
    const srcDir = path.join(TEST_DIR, 'source')
    await fs.ensureDir(path.join(srcDir, 'sub'))
    await fs.writeFile(path.join(srcDir, 'file.txt'), 'hello')
    await fs.writeFile(path.join(srcDir, 'sub', 'nested.txt'), 'world')

    const destDir = path.join(TEST_DIR, 'dest')
    await renderer.copyDir(srcDir, destDir)

    expect(await fs.readFile(path.join(destDir, 'file.txt'), 'utf-8')).toBe('hello')
    expect(await fs.readFile(path.join(destDir, 'sub', 'nested.txt'), 'utf-8')).toBe('world')
  })

  it('should render an EJS template to a file', async () => {
    const templatePath = path.join(TEST_DIR, 'template.ejs')
    await fs.writeFile(templatePath, 'Hello, <%= name %>! Port: <%= port %>')

    const outputPath = path.join(TEST_DIR, 'output.txt')
    await renderer.renderToFile(templatePath, outputPath, { name: 'World', port: 3000 })

    expect(await fs.readFile(outputPath, 'utf-8')).toBe('Hello, World! Port: 3000')
  })

  it('should render an EJS string directly', () => {
    const result = renderer.renderString('DB: <%= provider %>', { provider: 'postgresql' })
    expect(result).toBe('DB: postgresql')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/core/__tests__/template-renderer.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement template-renderer.ts**

```ts
// src/core/template-renderer.ts
import fs from 'fs-extra'
import ejs from 'ejs'
import path from 'path'

export class TemplateRenderer {
  async copyDir(source: string, dest: string): Promise<void> {
    await fs.copy(source, dest, { overwrite: true })
  }

  async renderToFile(
    templatePath: string,
    outputPath: string,
    data: Record<string, unknown>,
  ): Promise<void> {
    const template = await fs.readFile(templatePath, 'utf-8')
    const rendered = ejs.render(template, data)
    await fs.ensureDir(path.dirname(outputPath))
    await fs.writeFile(outputPath, rendered, 'utf-8')
  }

  renderString(template: string, data: Record<string, unknown>): string {
    return ejs.render(template, data)
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/core/__tests__/template-renderer.test.ts`
Expected: 3 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/core/template-renderer.ts src/core/__tests__/template-renderer.test.ts
git commit -m "feat: add template renderer with EJS support"
```

---

### Task 4: Module Wirer

**Files:**
- Create: `src/core/module-wirer.ts`
- Create: `src/core/__tests__/module-wirer.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/core/__tests__/module-wirer.test.ts
import { describe, it, expect } from 'vitest'
import { ModuleWirer } from '../module-wirer.js'

describe('ModuleWirer', () => {
  it('should inject a single module import and registration', () => {
    const source = `import { Module } from '@nestjs/common';

@Module({
  imports: [],
  controllers: [],
  providers: [],
})
export class AppModule {}
`
    const wirer = new ModuleWirer(source)
    wirer.addModule('PrismaModule', './prisma/prisma.module')

    const result = wirer.toString()

    expect(result).toContain("import { PrismaModule } from './prisma/prisma.module'")
    expect(result).toMatch(/imports:\s*\[[\s\S]*PrismaModule/)
  })

  it('should inject multiple modules preserving order', () => {
    const source = `import { Module } from '@nestjs/common';

@Module({
  imports: [],
  controllers: [],
  providers: [],
})
export class AppModule {}
`
    const wirer = new ModuleWirer(source)
    wirer.addModule('PrismaModule', './prisma/prisma.module')
    wirer.addModule('AuthModule', './auth/auth.module')

    const result = wirer.toString()

    expect(result).toContain("import { PrismaModule } from './prisma/prisma.module'")
    expect(result).toContain("import { AuthModule } from './auth/auth.module'")
    expect(result).toMatch(/imports:\s*\[[\s\S]*PrismaModule[\s\S]*AuthModule/)
  })

  it('should inject a provider', () => {
    const source = `import { Module } from '@nestjs/common';

@Module({
  imports: [],
  controllers: [],
  providers: [],
})
export class AppModule {}
`
    const wirer = new ModuleWirer(source)
    wirer.addProvider('AppService', './app.service')

    const result = wirer.toString()

    expect(result).toContain("import { AppService } from './app.service'")
    expect(result).toMatch(/providers:\s*\[[\s\S]*AppService/)
  })

  it('should work with existing imports in arrays', () => {
    const source = `import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule.forRoot()],
  controllers: [],
  providers: [],
})
export class AppModule {}
`
    const wirer = new ModuleWirer(source)
    wirer.addModule('PrismaModule', './prisma/prisma.module')

    const result = wirer.toString()

    expect(result).toContain("import { PrismaModule } from './prisma/prisma.module'")
    expect(result).toMatch(/imports:\s*\[[\s\S]*ConfigModule\.forRoot\(\)[\s\S]*PrismaModule/)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/core/__tests__/module-wirer.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement module-wirer.ts**

```ts
// src/core/module-wirer.ts

interface Registration {
  name: string
  importPath: string
}

export class ModuleWirer {
  private source: string
  private modules: Registration[] = []
  private providers: Registration[] = []

  constructor(source: string) {
    this.source = source
  }

  addModule(moduleName: string, importPath: string): void {
    this.modules.push({ name: moduleName, importPath })
  }

  addProvider(providerName: string, importPath: string): void {
    this.providers.push({ name: providerName, importPath })
  }

  toString(): string {
    let result = this.source

    // Add import statements before @Module decorator
    const allRegistrations = [...this.modules, ...this.providers]
    const importStatements = allRegistrations
      .map((r) => `import { ${r.name} } from '${r.importPath}';`)
      .join('\n')

    const moduleDecoratorIndex = result.indexOf('@Module(')
    if (moduleDecoratorIndex !== -1) {
      result = result.slice(0, moduleDecoratorIndex) + importStatements + '\n\n' + result.slice(moduleDecoratorIndex)
    }

    // Inject modules into imports array
    for (const mod of this.modules) {
      result = this.injectIntoArray(result, 'imports', mod.name)
    }

    // Inject providers into providers array
    for (const prov of this.providers) {
      result = this.injectIntoArray(result, 'providers', prov.name)
    }

    return result
  }

  private injectIntoArray(source: string, arrayName: string, value: string): string {
    // Match "imports: [...]" or "providers: [...]"
    const regex = new RegExp(`(${arrayName}:\\s*\\[)([^\\]]*)`, 's')
    const match = source.match(regex)
    if (!match) return source

    const existingContent = match[2].trim()
    const separator = existingContent.length > 0 ? ', ' : ''

    return source.replace(regex, `$1${match[2]}${separator}${value}`)
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/core/__tests__/module-wirer.test.ts`
Expected: 4 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/core/module-wirer.ts src/core/__tests__/module-wirer.test.ts
git commit -m "feat: add module wirer for NestJS app.module.ts injection"
```

---

### Task 5: Plugin Context Implementation

**Files:**
- Create: `src/core/plugin-context.ts`
- Create: `src/core/__tests__/plugin-context.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/core/__tests__/plugin-context.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement plugin-context.ts**

```ts
// src/core/plugin-context.ts
import fs from 'fs-extra'
import path from 'path'
import type {
  PluginContext,
  UserSelections,
  ProjectStructure,
  DockerServiceConfig,
  ModuleRegistration,
} from './types.js'
import { TemplateRenderer } from './template-renderer.js'

interface PluginContextOptions {
  projectName: string
  projectPath: string
  structure: ProjectStructure
  selections: UserSelections
}

export class PluginContextImpl implements PluginContext {
  readonly projectName: string
  readonly projectPath: string
  readonly structure: ProjectStructure
  readonly selections: UserSelections

  private deps: Record<string, string> = {}
  private devDeps: Record<string, string> = {}
  private scripts: Record<string, string> = {}
  private modules: ModuleRegistration[] = []
  private providers: ModuleRegistration[] = []
  private envVars: Record<string, string> = {}
  private dockerServices: Record<string, DockerServiceConfig> = {}
  private renderer = new TemplateRenderer()

  constructor(options: PluginContextOptions) {
    this.projectName = options.projectName
    this.projectPath = options.projectPath
    this.structure = options.structure
    this.selections = options.selections
  }

  copyTemplates(source: string, dest?: string): void {
    const target = dest ? path.join(this.projectPath, dest) : this.projectPath
    fs.copySync(source, target, { overwrite: true })
  }

  async renderTemplate(
    source: string,
    dest: string,
    data: Record<string, unknown>,
  ): Promise<void> {
    const outputPath = path.join(this.projectPath, dest)
    await this.renderer.renderToFile(source, outputPath, data)
  }

  addDependencies(deps: Record<string, string>): void {
    Object.assign(this.deps, deps)
  }

  addDevDependencies(deps: Record<string, string>): void {
    Object.assign(this.devDeps, deps)
  }

  addScripts(scripts: Record<string, string>): void {
    Object.assign(this.scripts, scripts)
  }

  registerModule(moduleName: string, importPath: string): void {
    this.modules.push({ moduleName, importPath })
  }

  registerProvider(providerName: string, importPath: string): void {
    this.providers.push({ moduleName: providerName, importPath })
  }

  addEnvVars(vars: Record<string, string>): void {
    Object.assign(this.envVars, vars)
  }

  addDockerService(name: string, config: DockerServiceConfig): void {
    this.dockerServices[name] = config
  }

  // Getters for engine to retrieve collected data
  getDependencies(): Record<string, string> {
    return { ...this.deps }
  }

  getDevDependencies(): Record<string, string> {
    return { ...this.devDeps }
  }

  getScripts(): Record<string, string> {
    return { ...this.scripts }
  }

  getModules(): ModuleRegistration[] {
    return [...this.modules]
  }

  getProviders(): ModuleRegistration[] {
    return [...this.providers]
  }

  getEnvVars(): Record<string, string> {
    return { ...this.envVars }
  }

  getDockerServices(): Record<string, DockerServiceConfig> {
    return { ...this.dockerServices }
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/core/__tests__/plugin-context.test.ts`
Expected: 7 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/core/plugin-context.ts src/core/__tests__/plugin-context.test.ts
git commit -m "feat: add plugin context implementation"
```

---

### Task 6: Plugin Registry

**Files:**
- Create: `src/core/plugin-registry.ts`
- Create: `src/core/__tests__/plugin-registry.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/core/__tests__/plugin-registry.test.ts
import { describe, it, expect } from 'vitest'
import { PluginRegistry } from '../plugin-registry.js'
import type { PluginDefinition, UserSelections } from '../types.js'
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

    // prisma is not compatible with mongodb, mongoose is
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/core/__tests__/plugin-registry.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement plugin-registry.ts**

```ts
// src/core/plugin-registry.ts
import type { PluginCategory, PluginDefinition, UserSelections } from './types.js'

export class PluginRegistry {
  private plugins: Map<string, PluginDefinition> = new Map()

  register(plugin: PluginDefinition): void {
    this.plugins.set(plugin.name, plugin)
  }

  get(name: string): PluginDefinition | undefined {
    return this.plugins.get(name)
  }

  getAll(): PluginDefinition[] {
    return Array.from(this.plugins.values())
  }

  getByCategory(category: PluginCategory): PluginDefinition[] {
    return this.getAll().filter((p) => p.category === category)
  }

  getCompatible(category: PluginCategory, selections: UserSelections): PluginDefinition[] {
    return this.getByCategory(category).filter(
      (p) => !p.isCompatible || p.isCompatible(selections),
    )
  }

  findConflicts(selectedNames: string[]): string[] {
    const conflicts: string[] = []

    for (let i = 0; i < selectedNames.length; i++) {
      const pluginA = this.plugins.get(selectedNames[i])
      if (!pluginA?.conflicts) continue

      for (let j = i + 1; j < selectedNames.length; j++) {
        if (pluginA.conflicts.includes(selectedNames[j])) {
          conflicts.push(`${selectedNames[i]} conflicts with ${selectedNames[j]}`)
        }
      }
    }

    return conflicts
  }

  resolveInstallOrder(selectedNames: string[]): string[] {
    const visited = new Set<string>()
    const result: string[] = []
    const selectedSet = new Set(selectedNames)

    const visit = (name: string) => {
      if (visited.has(name)) return
      visited.add(name)

      const plugin = this.plugins.get(name)
      if (!plugin) return

      // Visit required dependencies first (only those that are selected)
      if (plugin.requires) {
        for (const dep of plugin.requires) {
          if (selectedSet.has(dep)) {
            visit(dep)
          }
        }
      }

      result.push(name)
    }

    // Sort by category priority first for stable ordering
    const categoryOrder: PluginCategory[] = [
      'database', 'orm', 'auth', 'cache', 'realtime',
      'queue', 'mailer', 'upload', 'docs', 'infra', 'logger',
    ]

    const sorted = [...selectedNames].sort((a, b) => {
      const pluginA = this.plugins.get(a)
      const pluginB = this.plugins.get(b)
      const idxA = pluginA ? categoryOrder.indexOf(pluginA.category) : 999
      const idxB = pluginB ? categoryOrder.indexOf(pluginB.category) : 999
      return idxA - idxB
    })

    for (const name of sorted) {
      visit(name)
    }

    return result
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/core/__tests__/plugin-registry.test.ts`
Expected: 5 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/core/plugin-registry.ts src/core/__tests__/plugin-registry.test.ts
git commit -m "feat: add plugin registry with dependency resolution"
```

---

### Task 7: Generator Engine

**Files:**
- Create: `src/core/engine.ts`
- Create: `src/core/__tests__/engine.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
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
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/core/__tests__/engine.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement engine.ts**

```ts
// src/core/engine.ts
import fs from 'fs-extra'
import path from 'path'
import type { UserSelections } from './types.js'
import { PluginRegistry } from './plugin-registry.js'
import { PluginContextImpl } from './plugin-context.js'
import { ModuleWirer } from './module-wirer.js'

export interface GenerateOptions {
  outputDir: string
  selections: UserSelections
  skeletonsDir: string
  selectedPlugins?: string[]
  skipInstall?: boolean
  skipGit?: boolean
  skipFormat?: boolean
}

export class GeneratorEngine {
  constructor(private registry: PluginRegistry) {}

  async generate(options: GenerateOptions): Promise<string> {
    const { outputDir, selections, skeletonsDir, selectedPlugins = [] } = options
    const projectPath = path.join(outputDir, selections.projectName)

    // 1. Create project directory
    await fs.ensureDir(projectPath)

    // 2. Copy base skeleton
    const skeletonDir = path.join(skeletonsDir, selections.structure)
    if (await fs.pathExists(skeletonDir)) {
      await fs.copy(skeletonDir, projectPath, { overwrite: true })
    }

    // 3. Resolve plugin install order
    const orderedPlugins = this.registry.resolveInstallOrder(selectedPlugins)

    // 4. Run each plugin's install()
    const ctx = new PluginContextImpl({
      projectName: selections.projectName,
      projectPath,
      structure: selections.structure,
      selections,
    })

    for (const pluginName of orderedPlugins) {
      const plugin = this.registry.get(pluginName)
      if (plugin) {
        await plugin.install(ctx)
      }
    }

    // 5. Merge package.json
    await this.mergePackageJson(projectPath, selections.projectName, ctx)

    // 6. Generate .env.example
    await this.generateEnvFile(projectPath, ctx)

    // 7. Generate docker-compose.yml
    const dockerServices = ctx.getDockerServices()
    if (Object.keys(dockerServices).length > 0) {
      await this.generateDockerCompose(projectPath, dockerServices)
    }

    // 8. Wire modules into app.module.ts
    await this.wireModules(projectPath, selections.structure, ctx)

    return projectPath
  }

  private async mergePackageJson(
    projectPath: string,
    projectName: string,
    ctx: PluginContextImpl,
  ): Promise<void> {
    const pkgPath = path.join(projectPath, 'package.json')
    let pkg: Record<string, unknown> = {}

    if (await fs.pathExists(pkgPath)) {
      pkg = await fs.readJSON(pkgPath)
    }

    pkg.name = projectName
    pkg.version = '0.0.1'
    pkg.private = true

    const existingDeps = (pkg.dependencies as Record<string, string>) || {}
    const existingDevDeps = (pkg.devDependencies as Record<string, string>) || {}
    const existingScripts = (pkg.scripts as Record<string, string>) || {}

    pkg.dependencies = { ...existingDeps, ...ctx.getDependencies() }
    pkg.devDependencies = { ...existingDevDeps, ...ctx.getDevDependencies() }
    pkg.scripts = { ...existingScripts, ...ctx.getScripts() }

    await fs.writeJSON(pkgPath, pkg, { spaces: 2 })
  }

  private async generateEnvFile(projectPath: string, ctx: PluginContextImpl): Promise<void> {
    const envVars = ctx.getEnvVars()
    if (Object.keys(envVars).length === 0) return

    const content = Object.entries(envVars)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n')

    await fs.writeFile(path.join(projectPath, '.env.example'), content + '\n', 'utf-8')
    await fs.writeFile(path.join(projectPath, '.env'), content + '\n', 'utf-8')
  }

  private async generateDockerCompose(
    projectPath: string,
    services: Record<string, import('./types.js').DockerServiceConfig>,
  ): Promise<void> {
    let yaml = 'services:\n'

    for (const [name, config] of Object.entries(services)) {
      yaml += `  ${name}:\n`
      yaml += `    image: ${config.image}\n`

      if (config.restart) {
        yaml += `    restart: ${config.restart}\n`
      }

      if (config.ports?.length) {
        yaml += '    ports:\n'
        for (const port of config.ports) {
          yaml += `      - '${port}'\n`
        }
      }

      if (config.environment) {
        yaml += '    environment:\n'
        for (const [key, value] of Object.entries(config.environment)) {
          yaml += `      ${key}: ${value}\n`
        }
      }

      if (config.volumes?.length) {
        yaml += '    volumes:\n'
        for (const vol of config.volumes) {
          yaml += `      - ${vol}\n`
        }
      }

      yaml += '\n'
    }

    await fs.writeFile(path.join(projectPath, 'docker-compose.yml'), yaml, 'utf-8')
  }

  private async wireModules(
    projectPath: string,
    structure: string,
    ctx: PluginContextImpl,
  ): Promise<void> {
    const modules = ctx.getModules()
    const providers = ctx.getProviders()
    if (modules.length === 0 && providers.length === 0) return

    const appModulePath =
      structure === 'monorepo'
        ? path.join(projectPath, 'apps/api/src/app.module.ts')
        : path.join(projectPath, 'src/app.module.ts')

    if (!(await fs.pathExists(appModulePath))) return

    const source = await fs.readFile(appModulePath, 'utf-8')
    const wirer = new ModuleWirer(source)

    for (const mod of modules) {
      wirer.addModule(mod.moduleName, mod.importPath)
    }

    for (const prov of providers) {
      wirer.addProvider(prov.moduleName, prov.importPath)
    }

    await fs.writeFile(appModulePath, wirer.toString(), 'utf-8')
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/core/__tests__/engine.test.ts`
Expected: 4 tests PASS

Note: This task depends on the monolith skeleton existing (Task 8). If running tests before Task 8, either create a minimal skeleton or run tests after Task 8. The test uses `skeletonsDir` pointing to `src/skeletons` which must exist.

- [ ] **Step 5: Commit**

```bash
git add src/core/engine.ts src/core/__tests__/engine.test.ts
git commit -m "feat: add generator engine orchestrator"
```

---

## Phase 2: Skeletons

### Task 8: Monolith Skeleton

**Files:**
- Create: `src/skeletons/monolith/src/main.ts`
- Create: `src/skeletons/monolith/src/app.module.ts`
- Create: `src/skeletons/monolith/src/app.controller.ts`
- Create: `src/skeletons/monolith/src/app.service.ts`
- Create: `src/skeletons/monolith/src/common/decorators/public.decorator.ts`
- Create: `src/skeletons/monolith/src/common/filters/http-exception.filter.ts`
- Create: `src/skeletons/monolith/src/common/interceptors/transform.interceptor.ts`
- Create: `src/skeletons/monolith/src/config/app.config.ts`
- Create: `src/skeletons/monolith/package.json`
- Create: `src/skeletons/monolith/.prettierrc`
- Create: `src/skeletons/monolith/.eslintrc.js`
- Create: `src/skeletons/monolith/tsconfig.json`
- Create: `src/skeletons/monolith/tsconfig.build.json`
- Create: `src/skeletons/monolith/nest-cli.json`
- Create: `src/skeletons/monolith/README.md`

- [ ] **Step 1: Create main.ts**

```ts
// src/skeletons/monolith/src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors();

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}

bootstrap();
```

- [ ] **Step 2: Create app.module.ts**

```ts
// src/skeletons/monolith/src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

- [ ] **Step 3: Create app.controller.ts and app.service.ts**

```ts
// src/skeletons/monolith/src/app.controller.ts
import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
```

```ts
// src/skeletons/monolith/src/app.service.ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }
}
```

- [ ] **Step 4: Create common utilities**

```ts
// src/skeletons/monolith/src/common/decorators/public.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
```

```ts
// src/skeletons/monolith/src/common/filters/http-exception.filter.ts
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse = exception.getResponse();
    const message =
      typeof exceptionResponse === 'string'
        ? exceptionResponse
        : (exceptionResponse as Record<string, unknown>).message || 'Internal server error';

    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
    });
  }
}
```

```ts
// src/skeletons/monolith/src/common/interceptors/transform.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  data: T;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    return next.handle().pipe(map((data) => ({ data })));
  }
}
```

```ts
// src/skeletons/monolith/src/config/app.config.ts
import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
}));
```

- [ ] **Step 5: Create config files**

```json
// src/skeletons/monolith/package.json
{
  "name": "my-project",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "build": "nest build",
    "format": "prettier --write \"src/**/*.ts\"",
    "start": "nest start",
    "start:dev": "nest start --watch",
    "start:debug": "nest start --debug --watch",
    "start:prod": "node dist/main",
    "lint": "eslint \"{src,test}/**/*.ts\" --fix",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage"
  },
  "dependencies": {
    "@nestjs/common": "^11.0.0",
    "@nestjs/config": "^4.0.0",
    "@nestjs/core": "^11.0.0",
    "@nestjs/platform-express": "^11.0.0",
    "class-transformer": "^0.5.1",
    "class-validator": "^0.14.1",
    "reflect-metadata": "^0.2.2",
    "rxjs": "^7.8.1"
  },
  "devDependencies": {
    "@nestjs/cli": "^11.0.0",
    "@nestjs/schematics": "^11.0.0",
    "@nestjs/testing": "^11.0.0",
    "@types/express": "^5.0.0",
    "@types/node": "^22.0.0",
    "prettier": "^3.4.0",
    "source-map-support": "^0.5.21",
    "ts-jest": "^29.2.0",
    "ts-loader": "^9.5.0",
    "ts-node": "^10.9.0",
    "tsconfig-paths": "^4.2.0",
    "typescript": "^5.7.0"
  }
}
```

```json
// src/skeletons/monolith/tsconfig.json
{
  "compilerOptions": {
    "module": "commonjs",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2021",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "skipLibCheck": true,
    "strictNullChecks": true,
    "noImplicitAny": true,
    "strictBindCallApply": true,
    "forceConsistentCasingInFileNames": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

```json
// src/skeletons/monolith/tsconfig.build.json
{
  "extends": "./tsconfig.json",
  "exclude": ["node_modules", "test", "dist", "**/*spec.ts"]
}
```

```json
// src/skeletons/monolith/nest-cli.json
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "deleteOutDir": true
  }
}
```

```json
// src/skeletons/monolith/.prettierrc
{
  "singleQuote": true,
  "trailingComma": "all"
}
```

```js
// src/skeletons/monolith/.eslintrc.js
module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint/eslint-plugin'],
  extends: [
    'plugin:@typescript-eslint/recommended',
  ],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: ['.eslintrc.js'],
  rules: {
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
  },
};
```

- [ ] **Step 6: Commit**

```bash
git add src/skeletons/monolith/
git commit -m "feat: add monolith skeleton template"
```

---

### Task 9: Monorepo Skeleton

**Files:**
- Create: `src/skeletons/monorepo/apps/api/src/main.ts`
- Create: `src/skeletons/monorepo/apps/api/src/app.module.ts`
- Create: `src/skeletons/monorepo/apps/api/src/app.controller.ts`
- Create: `src/skeletons/monorepo/apps/api/src/app.service.ts`
- Create: `src/skeletons/monorepo/apps/api/tsconfig.app.json`
- Create: `src/skeletons/monorepo/libs/common/src/index.ts`
- Create: `src/skeletons/monorepo/libs/common/src/decorators/public.decorator.ts`
- Create: `src/skeletons/monorepo/libs/common/src/filters/http-exception.filter.ts`
- Create: `src/skeletons/monorepo/libs/common/src/interceptors/transform.interceptor.ts`
- Create: `src/skeletons/monorepo/libs/common/tsconfig.lib.json`
- Create: `src/skeletons/monorepo/package.json`
- Create: `src/skeletons/monorepo/tsconfig.json`
- Create: `src/skeletons/monorepo/nest-cli.json`
- Create: `src/skeletons/monorepo/.prettierrc`

- [ ] **Step 1: Create monorepo app entry files**

`apps/api/src/main.ts` — same as monolith `main.ts`.

`apps/api/src/app.module.ts` — same as monolith `app.module.ts`.

`apps/api/src/app.controller.ts` — same as monolith `app.controller.ts`.

`apps/api/src/app.service.ts` — same as monolith `app.service.ts`.

```json
// src/skeletons/monorepo/apps/api/tsconfig.app.json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "../../dist/apps/api"
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist", "test", "**/*spec.ts"]
}
```

- [ ] **Step 2: Create libs/common files**

`libs/common/src/decorators/public.decorator.ts` — same as monolith.

`libs/common/src/filters/http-exception.filter.ts` — same as monolith.

`libs/common/src/interceptors/transform.interceptor.ts` — same as monolith.

```ts
// src/skeletons/monorepo/libs/common/src/index.ts
export * from './decorators/public.decorator';
export * from './filters/http-exception.filter';
export * from './interceptors/transform.interceptor';
```

```json
// src/skeletons/monorepo/libs/common/tsconfig.lib.json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "../../dist/libs/common"
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist", "test", "**/*spec.ts"]
}
```

- [ ] **Step 3: Create monorepo config files**

```json
// src/skeletons/monorepo/package.json
{
  "name": "my-project",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "build": "nest build",
    "format": "prettier --write \"apps/**/*.ts\" \"libs/**/*.ts\"",
    "start": "nest start",
    "start:dev": "nest start --watch",
    "start:debug": "nest start --debug --watch",
    "start:prod": "node dist/apps/api/main",
    "lint": "eslint \"{apps,libs}/**/*.ts\" --fix",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage"
  },
  "dependencies": {
    "@nestjs/common": "^11.0.0",
    "@nestjs/config": "^4.0.0",
    "@nestjs/core": "^11.0.0",
    "@nestjs/platform-express": "^11.0.0",
    "class-transformer": "^0.5.1",
    "class-validator": "^0.14.1",
    "reflect-metadata": "^0.2.2",
    "rxjs": "^7.8.1"
  },
  "devDependencies": {
    "@nestjs/cli": "^11.0.0",
    "@nestjs/schematics": "^11.0.0",
    "@nestjs/testing": "^11.0.0",
    "@types/express": "^5.0.0",
    "@types/node": "^22.0.0",
    "prettier": "^3.4.0",
    "source-map-support": "^0.5.21",
    "ts-jest": "^29.2.0",
    "ts-loader": "^9.5.0",
    "ts-node": "^10.9.0",
    "tsconfig-paths": "^4.2.0",
    "typescript": "^5.7.0"
  }
}
```

```json
// src/skeletons/monorepo/tsconfig.json
{
  "compilerOptions": {
    "module": "commonjs",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2021",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "skipLibCheck": true,
    "strictNullChecks": true,
    "noImplicitAny": true,
    "strictBindCallApply": true,
    "forceConsistentCasingInFileNames": true,
    "noFallthroughCasesInSwitch": true,
    "paths": {
      "@app/common": ["libs/common/src"],
      "@app/common/*": ["libs/common/src/*"]
    }
  }
}
```

```json
// src/skeletons/monorepo/nest-cli.json
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "apps/api/src",
  "monorepo": true,
  "root": "apps/api",
  "compilerOptions": {
    "webpack": true,
    "tsConfigPath": "apps/api/tsconfig.app.json"
  },
  "projects": {
    "api": {
      "type": "application",
      "root": "apps/api",
      "entryFile": "main",
      "sourceRoot": "apps/api/src",
      "compilerOptions": {
        "tsConfigPath": "apps/api/tsconfig.app.json"
      }
    },
    "common": {
      "type": "library",
      "root": "libs/common",
      "entryFile": "index",
      "sourceRoot": "libs/common/src",
      "compilerOptions": {
        "tsConfigPath": "libs/common/tsconfig.lib.json"
      }
    }
  }
}
```

```json
// src/skeletons/monorepo/.prettierrc
{
  "singleQuote": true,
  "trailingComma": "all"
}
```

- [ ] **Step 4: Commit**

```bash
git add src/skeletons/monorepo/
git commit -m "feat: add monorepo skeleton template"
```

---

## Phase 3: CLI

### Task 10: Interactive Prompts

**Files:**
- Create: `src/cli/prompts.ts`

- [ ] **Step 1: Implement prompts.ts**

```ts
// src/cli/prompts.ts
import inquirer from 'inquirer'
import type { UserSelections, PluginCategory } from '../core/types.js'
import { PluginRegistry } from '../core/plugin-registry.js'

export async function runPrompts(
  registry: PluginRegistry,
  projectNameArg?: string,
): Promise<UserSelections> {
  const { projectName } = projectNameArg
    ? { projectName: projectNameArg }
    : await inquirer.prompt([
        {
          type: 'input',
          name: 'projectName',
          message: 'Project name:',
          default: 'my-nest-app',
          validate: (input: string) =>
            /^[a-z0-9-_]+$/.test(input) || 'Use lowercase, numbers, hyphens, underscores only',
        },
      ])

  const { structure } = await inquirer.prompt([
    {
      type: 'list',
      name: 'structure',
      message: 'Project structure:',
      choices: [
        { name: 'Monolith — single application', value: 'monolith' },
        { name: 'Monorepo — multiple apps + shared libs', value: 'monorepo' },
      ],
    },
  ])

  const { packageManager } = await inquirer.prompt([
    {
      type: 'list',
      name: 'packageManager',
      message: 'Package manager:',
      choices: [
        { name: 'npm', value: 'npm' },
        { name: 'yarn', value: 'yarn' },
        { name: 'pnpm', value: 'pnpm' },
        { name: 'bun', value: 'bun' },
      ],
    },
  ])

  // Build selections progressively with smart filtering
  const selections: UserSelections = {
    projectName,
    structure,
    packageManager,
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

  // Database
  selections.database = await promptCategory(registry, 'database', selections, 'Database:')

  // ORM (filtered by database)
  if (selections.database) {
    selections.orm = await promptCategory(registry, 'orm', selections, 'ORM:')
  }

  // Auth (requires ORM)
  if (selections.orm) {
    selections.auth = await promptCategory(registry, 'auth', selections, 'Authentication:')
  }

  // Cache
  selections.cache = await promptCategory(registry, 'cache', selections, 'Caching:')

  // Realtime
  selections.realtime = await promptCategory(registry, 'realtime', selections, 'Realtime:')

  // Docs
  selections.docs = await promptCategory(registry, 'docs', selections, 'API Documentation:')

  // Docker
  const { docker } = await inquirer.prompt([
    { type: 'confirm', name: 'docker', message: 'Docker support?', default: true },
  ])
  selections.docker = docker

  // Logger
  selections.logger = await promptCategory(registry, 'logger', selections, 'Logger:')

  // Queue (filtered by redis)
  selections.queue = await promptCategory(registry, 'queue', selections, 'Queue:')

  // Mailer
  selections.mailer = await promptCategory(registry, 'mailer', selections, 'Mailer:')

  // Upload
  selections.upload = await promptCategory(registry, 'upload', selections, 'File Upload:')

  return selections
}

async function promptCategory(
  registry: PluginRegistry,
  category: PluginCategory,
  selections: UserSelections,
  message: string,
): Promise<string | null> {
  const compatible = registry.getCompatible(category, selections)
  if (compatible.length === 0) return null

  const choices = [
    ...compatible.map((p) => ({ name: `${p.displayName} — ${p.description}`, value: p.name })),
    { name: 'None', value: '__none__' },
  ]

  const { selected } = await inquirer.prompt([
    { type: 'list', name: 'selected', message, choices },
  ])

  return selected === '__none__' ? null : selected
}
```

- [ ] **Step 2: Commit**

```bash
git add src/cli/prompts.ts
git commit -m "feat: add interactive CLI prompts with smart filtering"
```

---

### Task 11: Summary Display & CLI Entry Point

**Files:**
- Create: `src/cli/summary.ts`
- Create: `bin/cli.ts`

- [ ] **Step 1: Create summary.ts**

```ts
// src/cli/summary.ts
import chalk from 'chalk'
import inquirer from 'inquirer'
import type { UserSelections } from '../core/types.js'

export async function showSummary(selections: UserSelections): Promise<boolean> {
  console.log('')
  console.log(chalk.bold('Project Configuration:'))
  console.log(chalk.gray('─'.repeat(40)))
  console.log(`  ${chalk.cyan('Name:')}        ${selections.projectName}`)
  console.log(`  ${chalk.cyan('Structure:')}   ${selections.structure}`)
  console.log(`  ${chalk.cyan('Pkg Manager:')} ${selections.packageManager}`)
  console.log('')

  const features: [string, string | null | boolean][] = [
    ['Database', selections.database],
    ['ORM', selections.orm],
    ['Auth', selections.auth],
    ['Cache', selections.cache],
    ['Realtime', selections.realtime],
    ['API Docs', selections.docs],
    ['Docker', selections.docker],
    ['Logger', selections.logger],
    ['Queue', selections.queue],
    ['Mailer', selections.mailer],
    ['Upload', selections.upload],
  ]

  console.log(chalk.bold('Selected features:'))
  for (const [label, value] of features) {
    if (value === null || value === false) continue
    const display = typeof value === 'boolean' ? 'Yes' : value
    console.log(`  ${chalk.green('✓')} ${label}: ${chalk.white(display)}`)
  }
  console.log(chalk.gray('─'.repeat(40)))
  console.log('')

  const { confirmed } = await inquirer.prompt([
    { type: 'confirm', name: 'confirmed', message: 'Proceed with this configuration?', default: true },
  ])

  return confirmed
}
```

- [ ] **Step 2: Create bin/cli.ts**

```ts
// bin/cli.ts
import { Command } from 'commander'
import chalk from 'chalk'
import ora from 'ora'
import path from 'path'
import { fileURLToPath } from 'url'
import { runPrompts } from '../src/cli/prompts.js'
import { showSummary } from '../src/cli/summary.js'
import { GeneratorEngine } from '../src/core/engine.js'
import { PluginRegistry } from '../src/core/plugin-registry.js'
import { loadAllPlugins } from '../src/plugins/index.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const program = new Command()

program
  .name('quickstart-nestjs')
  .description('Scaffold production-ready NestJS projects')
  .version('0.1.0')
  .argument('[project-name]', 'Name of the project')
  .action(async (projectName?: string) => {
    console.log('')
    console.log(chalk.bold.cyan('⚡ quickstart-nestjs'))
    console.log(chalk.gray('Scaffold production-ready NestJS projects'))
    console.log('')

    // Load plugins
    const registry = new PluginRegistry()
    loadAllPlugins(registry)

    // Run prompts
    let selections = await runPrompts(registry, projectName)

    // Show summary and confirm
    let confirmed = await showSummary(selections)
    while (!confirmed) {
      selections = await runPrompts(registry, projectName)
      confirmed = await showSummary(selections)
    }

    // Collect selected plugin names
    const selectedPlugins: string[] = []
    const pluginFields: (keyof typeof selections)[] = [
      'database', 'orm', 'auth', 'cache', 'realtime', 'docs', 'logger', 'queue', 'mailer', 'upload',
    ]
    for (const field of pluginFields) {
      const val = selections[field]
      if (typeof val === 'string') selectedPlugins.push(val)
    }
    if (selections.docker) selectedPlugins.push('docker')

    // Generate
    const spinner = ora('Generating project...').start()
    const skeletonsDir = path.resolve(__dirname, '../src/skeletons')
    const outputDir = process.cwd()

    try {
      const engine = new GeneratorEngine(registry)
      const projectPath = await engine.generate({
        outputDir,
        selections,
        skeletonsDir,
        selectedPlugins,
      })

      spinner.succeed('Project generated!')
      console.log('')
      console.log(chalk.bold('Next steps:'))
      console.log(`  cd ${selections.projectName}`)
      console.log(`  ${selections.packageManager} run start:dev`)
      console.log('')
    } catch (err) {
      spinner.fail('Generation failed')
      console.error(err)
      process.exit(1)
    }
  })

program.parse()
```

- [ ] **Step 3: Create plugins index (placeholder)**

```ts
// src/plugins/index.ts
import { PluginRegistry } from '../core/plugin-registry.js'

// Plugin imports will be added as plugins are implemented
export function loadAllPlugins(registry: PluginRegistry): void {
  // Plugins registered here
}
```

- [ ] **Step 4: Commit**

```bash
git add src/cli/summary.ts bin/cli.ts src/plugins/index.ts
git commit -m "feat: add CLI entry point with prompts and summary"
```

---

## Phase 4: Plugins (MVP Set)

Each plugin follows the same pattern: `definePlugin()` + template files. Tasks below are grouped by category. Each task lists the plugin's `index.ts` and all template files to create.

### Task 12: Database Plugins (postgres, mysql, mongodb, sqlite)

**Files:**
- Create: `src/plugins/postgres/index.ts`
- Create: `src/plugins/mysql/index.ts`
- Create: `src/plugins/mongodb/index.ts`
- Create: `src/plugins/sqlite/index.ts`
- Create: `src/plugins/__tests__/database-plugins.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/plugins/__tests__/database-plugins.test.ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/plugins/__tests__/database-plugins.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement all database plugins**

```ts
// src/plugins/postgres/index.ts
import { definePlugin } from '../../core/types.js'

export const postgresPlugin = definePlugin({
  name: 'postgres',
  category: 'database',
  displayName: 'PostgreSQL',
  description: 'Powerful, open source relational database',
  conflicts: ['mysql', 'mongodb', 'sqlite'],

  install: async (ctx) => {
    ctx.addEnvVars({
      DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/mydb',
    })

    ctx.addDockerService('postgres', {
      image: 'postgres:16-alpine',
      restart: 'unless-stopped',
      ports: ['5432:5432'],
      environment: {
        POSTGRES_USER: 'postgres',
        POSTGRES_PASSWORD: 'postgres',
        POSTGRES_DB: 'mydb',
      },
      volumes: ['postgres_data:/var/lib/postgresql/data'],
    })
  },
})
```

```ts
// src/plugins/mysql/index.ts
import { definePlugin } from '../../core/types.js'

export const mysqlPlugin = definePlugin({
  name: 'mysql',
  category: 'database',
  displayName: 'MySQL',
  description: 'Popular open source relational database',
  conflicts: ['postgres', 'mongodb', 'sqlite'],

  install: async (ctx) => {
    ctx.addEnvVars({
      DATABASE_URL: 'mysql://root:root@localhost:3306/mydb',
    })

    ctx.addDockerService('mysql', {
      image: 'mysql:8.0',
      restart: 'unless-stopped',
      ports: ['3306:3306'],
      environment: {
        MYSQL_ROOT_PASSWORD: 'root',
        MYSQL_DATABASE: 'mydb',
      },
      volumes: ['mysql_data:/var/lib/mysql'],
    })
  },
})
```

```ts
// src/plugins/mongodb/index.ts
import { definePlugin } from '../../core/types.js'

export const mongodbPlugin = definePlugin({
  name: 'mongodb',
  category: 'database',
  displayName: 'MongoDB',
  description: 'Document-oriented NoSQL database',
  conflicts: ['postgres', 'mysql', 'sqlite'],

  install: async (ctx) => {
    ctx.addEnvVars({
      DATABASE_URL: 'mongodb://root:root@localhost:27017/mydb?authSource=admin',
    })

    ctx.addDockerService('mongodb', {
      image: 'mongo:7',
      restart: 'unless-stopped',
      ports: ['27017:27017'],
      environment: {
        MONGO_INITDB_ROOT_USERNAME: 'root',
        MONGO_INITDB_ROOT_PASSWORD: 'root',
        MONGO_INITDB_DATABASE: 'mydb',
      },
      volumes: ['mongodb_data:/data/db'],
    })
  },
})
```

```ts
// src/plugins/sqlite/index.ts
import { definePlugin } from '../../core/types.js'

export const sqlitePlugin = definePlugin({
  name: 'sqlite',
  category: 'database',
  displayName: 'SQLite',
  description: 'Lightweight, file-based database',
  conflicts: ['postgres', 'mysql', 'mongodb'],

  install: async (ctx) => {
    ctx.addEnvVars({
      DATABASE_URL: 'file:./dev.db',
    })
  },
})
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/plugins/__tests__/database-plugins.test.ts`
Expected: 5 tests PASS

- [ ] **Step 5: Register plugins in index.ts**

Update `src/plugins/index.ts`:

```ts
import { PluginRegistry } from '../core/plugin-registry.js'
import { postgresPlugin } from './postgres/index.js'
import { mysqlPlugin } from './mysql/index.js'
import { mongodbPlugin } from './mongodb/index.js'
import { sqlitePlugin } from './sqlite/index.js'

export function loadAllPlugins(registry: PluginRegistry): void {
  registry.register(postgresPlugin)
  registry.register(mysqlPlugin)
  registry.register(mongodbPlugin)
  registry.register(sqlitePlugin)
}
```

- [ ] **Step 6: Commit**

```bash
git add src/plugins/
git commit -m "feat: add database plugins (postgres, mysql, mongodb, sqlite)"
```

---

### Task 13: ORM Plugins (prisma, typeorm, sequelize, mongoose)

**Files:**
- Create: `src/plugins/prisma/index.ts`
- Create: `src/plugins/prisma/templates/src/prisma/prisma.module.ts`
- Create: `src/plugins/prisma/templates/src/prisma/prisma.service.ts`
- Create: `src/plugins/prisma/templates/prisma/schema.prisma.ejs`
- Create: `src/plugins/typeorm/index.ts`
- Create: `src/plugins/typeorm/templates/src/database/database.module.ts`
- Create: `src/plugins/sequelize/index.ts`
- Create: `src/plugins/sequelize/templates/src/database/database.module.ts`
- Create: `src/plugins/mongoose/index.ts`
- Create: `src/plugins/mongoose/templates/src/database/database.module.ts`
- Create: `src/plugins/__tests__/orm-plugins.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/plugins/__tests__/orm-plugins.test.ts
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
    })

    await mongoosePlugin.install(ctx)

    expect(ctx.getDependencies()).toHaveProperty('@nestjs/mongoose')
    expect(ctx.getDependencies()).toHaveProperty('mongoose')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/plugins/__tests__/orm-plugins.test.ts`
Expected: FAIL

- [ ] **Step 3: Create Prisma plugin with templates**

```ts
// src/plugins/prisma/index.ts
import path from 'path'
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

    // Determine prisma provider from database selection
    const providerMap: Record<string, string> = {
      postgres: 'postgresql',
      mysql: 'mysql',
      sqlite: 'sqlite',
    }
    const provider = providerMap[ctx.selections.database || 'postgres'] || 'postgresql'

    // Generate schema.prisma with correct provider
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
    const fs = await import('fs-extra')
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
```

```ts
// src/plugins/prisma/templates/src/prisma/prisma.module.ts
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

```ts
// src/plugins/prisma/templates/src/prisma/prisma.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

- [ ] **Step 4: Create TypeORM plugin**

```ts
// src/plugins/typeorm/index.ts
import path from 'path'
import { definePlugin } from '../../core/types.js'

export const typeormPlugin = definePlugin({
  name: 'typeorm',
  category: 'orm',
  displayName: 'TypeORM',
  description: 'Full-featured ORM with decorator-based entities',
  conflicts: ['prisma', 'sequelize', 'mongoose'],
  requires: ['postgres', 'mysql', 'sqlite', 'mongodb'],
  isCompatible: (sel) => sel.database !== null,

  install: async (ctx) => {
    const templateDir = path.join(import.meta.dirname, 'templates')
    ctx.copyTemplates(path.join(templateDir, 'src'), 'src')

    const dbDriverMap: Record<string, string> = {
      postgres: 'pg',
      mysql: 'mysql2',
      mongodb: 'mongodb',
      sqlite: 'better-sqlite3',
    }
    const typeMap: Record<string, string> = {
      postgres: 'postgres',
      mysql: 'mysql',
      mongodb: 'mongodb',
      sqlite: 'better-sqlite3',
    }

    const db = ctx.selections.database || 'postgres'
    const driver = dbDriverMap[db]
    const type = typeMap[db]

    ctx.addDependencies({
      typeorm: '^0.3.20',
      '@nestjs/typeorm': '^11.0.0',
      [driver]: 'latest',
    })

    ctx.registerModule('DatabaseModule', './database/database.module')
  },
})
```

```ts
// src/plugins/typeorm/templates/src/database/database.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        type: process.env.DB_TYPE as any || 'postgres',
        url: configService.get<string>('DATABASE_URL'),
        autoLoadEntities: true,
        synchronize: process.env.NODE_ENV !== 'production',
      }),
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
```

- [ ] **Step 5: Create Sequelize plugin**

```ts
// src/plugins/sequelize/index.ts
import path from 'path'
import { definePlugin } from '../../core/types.js'

export const sequelizePlugin = definePlugin({
  name: 'sequelize',
  category: 'orm',
  displayName: 'Sequelize',
  description: 'Promise-based ORM with transaction support',
  conflicts: ['prisma', 'typeorm', 'mongoose'],
  requires: ['postgres', 'mysql', 'sqlite'],
  isCompatible: (sel) => sel.database !== 'mongodb' && sel.database !== null,

  install: async (ctx) => {
    const templateDir = path.join(import.meta.dirname, 'templates')
    ctx.copyTemplates(path.join(templateDir, 'src'), 'src')

    const dialectMap: Record<string, string> = {
      postgres: 'postgres',
      mysql: 'mysql',
      sqlite: 'sqlite',
    }
    const driverMap: Record<string, string> = {
      postgres: 'pg pg-hstore',
      mysql: 'mysql2',
      sqlite: 'sqlite3',
    }

    const db = ctx.selections.database || 'postgres'

    ctx.addDependencies({
      '@nestjs/sequelize': '^11.0.0',
      sequelize: '^6.37.0',
      'sequelize-typescript': '^2.1.6',
    })

    // Add db-specific driver
    const drivers = driverMap[db]?.split(' ') || []
    for (const d of drivers) {
      ctx.addDependencies({ [d]: 'latest' })
    }

    ctx.registerModule('DatabaseModule', './database/database.module')
  },
})
```

```ts
// src/plugins/sequelize/templates/src/database/database.module.ts
import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    SequelizeModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('DATABASE_URL'),
        autoLoadModels: true,
        synchronize: process.env.NODE_ENV !== 'production',
      }),
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
```

- [ ] **Step 6: Create Mongoose plugin**

```ts
// src/plugins/mongoose/index.ts
import path from 'path'
import { definePlugin } from '../../core/types.js'

export const mongoosePlugin = definePlugin({
  name: 'mongoose',
  category: 'orm',
  displayName: 'Mongoose',
  description: 'Elegant MongoDB ODM',
  conflicts: ['prisma', 'typeorm', 'sequelize'],
  requires: ['mongodb'],
  isCompatible: (sel) => sel.database === 'mongodb',

  install: async (ctx) => {
    const templateDir = path.join(import.meta.dirname, 'templates')
    ctx.copyTemplates(path.join(templateDir, 'src'), 'src')

    ctx.addDependencies({
      '@nestjs/mongoose': '^11.0.0',
      mongoose: '^8.9.0',
    })

    ctx.registerModule('DatabaseModule', './database/database.module')
  },
})
```

```ts
// src/plugins/mongoose/templates/src/database/database.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('DATABASE_URL'),
      }),
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
```

- [ ] **Step 7: Run test to verify it passes**

Run: `npx vitest run src/plugins/__tests__/orm-plugins.test.ts`
Expected: 5 tests PASS

- [ ] **Step 8: Update plugins/index.ts**

Add imports and register calls for all 4 ORM plugins.

- [ ] **Step 9: Commit**

```bash
git add src/plugins/
git commit -m "feat: add ORM plugins (prisma, typeorm, sequelize, mongoose)"
```

---

### Task 14: Auth Plugin (JWT)

**Files:**
- Create: `src/plugins/jwt/index.ts`
- Create: `src/plugins/jwt/templates/src/auth/auth.module.ts`
- Create: `src/plugins/jwt/templates/src/auth/auth.controller.ts`
- Create: `src/plugins/jwt/templates/src/auth/auth.service.ts`
- Create: `src/plugins/jwt/templates/src/auth/guards/jwt-auth.guard.ts`
- Create: `src/plugins/jwt/templates/src/auth/strategies/jwt.strategy.ts`
- Create: `src/plugins/jwt/templates/src/auth/dto/login.dto.ts`
- Create: `src/plugins/jwt/templates/src/auth/dto/register.dto.ts`
- Create: `src/plugins/jwt/templates/src/users/users.module.ts`
- Create: `src/plugins/jwt/templates/src/users/users.controller.ts`
- Create: `src/plugins/jwt/templates/src/users/users.service.ts`
- Create: `src/plugins/jwt/templates/src/users/dto/create-user.dto.ts`
- Create: `src/plugins/__tests__/jwt-plugin.test.ts`

- [ ] **Step 1: Write test, implement plugin index.ts, create all template files**

Follow the same pattern as Task 13. The JWT plugin:
- `conflicts: []`
- `requires: ['prisma', 'typeorm', 'sequelize', 'mongoose']` (needs at least one ORM)
- `isCompatible: (sel) => sel.orm !== null`
- Adds deps: `@nestjs/jwt`, `@nestjs/passport`, `passport`, `passport-jwt`, `bcrypt`, `@types/passport-jwt`, `@types/bcrypt`
- Adds env: `JWT_SECRET`, `JWT_EXPIRES_IN`
- Registers: `AuthModule`, `UsersModule`
- Template files contain full working auth with register/login endpoints, JWT strategy, guards, user CRUD

- [ ] **Step 2: Run test, verify pass**

- [ ] **Step 3: Update plugins/index.ts, commit**

```bash
git add src/plugins/
git commit -m "feat: add JWT authentication plugin with auth and users modules"
```

---

### Task 15: Cache & Realtime Plugins (redis, socket-io, websocket)

**Files:**
- Create: `src/plugins/redis/index.ts`
- Create: `src/plugins/redis/templates/src/cache/cache.module.ts`
- Create: `src/plugins/socket-io/index.ts`
- Create: `src/plugins/socket-io/templates/src/gateway/app.gateway.ts`
- Create: `src/plugins/socket-io/templates/src/gateway/gateway.module.ts`
- Create: `src/plugins/websocket/index.ts`
- Create: `src/plugins/websocket/templates/src/gateway/app.gateway.ts`
- Create: `src/plugins/websocket/templates/src/gateway/gateway.module.ts`

- [ ] **Step 1: Implement Redis plugin**

- Adds deps: `@nestjs/cache-manager`, `cache-manager`, `cache-manager-redis-yet`, `redis`
- Adds env: `REDIS_HOST`, `REDIS_PORT`
- Docker service: `redis:7-alpine` on port 6379
- Registers: `CacheModule`

- [ ] **Step 2: Implement Socket.io plugin**

- Adds deps: `@nestjs/websockets`, `@nestjs/platform-socket.io`, `socket.io`
- Registers: `GatewayModule`
- Template: basic gateway with `handleConnection`, `handleDisconnect`, sample event handler

- [ ] **Step 3: Implement WebSocket plugin**

- Adds deps: `@nestjs/websockets`, `@nestjs/platform-ws`, `ws`
- Registers: `GatewayModule`
- Template: similar to socket-io but using native WS adapter

- [ ] **Step 4: Write tests, run, verify pass**

- [ ] **Step 5: Update plugins/index.ts, commit**

```bash
git add src/plugins/
git commit -m "feat: add redis, socket-io, websocket plugins"
```

---

### Task 16: Infrastructure Plugins (swagger, docker, pino, winston)

**Files:**
- Create: `src/plugins/swagger/index.ts`
- Create: `src/plugins/docker/index.ts`
- Create: `src/plugins/docker/templates/Dockerfile`
- Create: `src/plugins/docker/templates/.dockerignore`
- Create: `src/plugins/pino/index.ts`
- Create: `src/plugins/winston/index.ts`
- Create: `src/plugins/winston/templates/src/logger/logger.module.ts`
- Create: `src/plugins/winston/templates/src/logger/logger.service.ts`

- [ ] **Step 1: Implement Swagger plugin**

- Adds deps: `@nestjs/swagger`
- Modifies main.ts setup (adds `SwaggerModule.setup` — handled via a `postInstall` hook or by providing a main.ts patch template)
- No separate module — configured in `main.ts`

- [ ] **Step 2: Implement Docker plugin**

- No deps, no module
- Copies `Dockerfile` (multi-stage build) and `.dockerignore`

- [ ] **Step 3: Implement Pino and Winston logger plugins**

Pino:
- Adds deps: `nestjs-pino`, `pino-http`, `pino-pretty`
- Registers: `LoggerModule` from `nestjs-pino`

Winston:
- Adds deps: `nest-winston`, `winston`
- Registers custom `LoggerModule`

- [ ] **Step 4: Write tests, run, verify pass**

- [ ] **Step 5: Update plugins/index.ts, commit**

```bash
git add src/plugins/
git commit -m "feat: add swagger, docker, pino, winston plugins"
```

---

### Task 17: Utility Plugins (bullmq, mailer, upload-s3, upload-local)

**Files:**
- Create: `src/plugins/bullmq/index.ts`
- Create: `src/plugins/bullmq/templates/src/queue/queue.module.ts`
- Create: `src/plugins/mailer/index.ts`
- Create: `src/plugins/mailer/templates/src/mailer/mailer.module.ts`
- Create: `src/plugins/upload-s3/index.ts`
- Create: `src/plugins/upload-s3/templates/src/upload/upload.module.ts`
- Create: `src/plugins/upload-s3/templates/src/upload/upload.controller.ts`
- Create: `src/plugins/upload-s3/templates/src/upload/upload.service.ts`
- Create: `src/plugins/upload-local/index.ts`
- Create: `src/plugins/upload-local/templates/src/upload/upload.module.ts`
- Create: `src/plugins/upload-local/templates/src/upload/upload.controller.ts`
- Create: `src/plugins/upload-local/templates/src/upload/upload.service.ts`

- [ ] **Step 1: Implement BullMQ plugin**

- `requires: ['redis']`, `isCompatible: (sel) => sel.cache === 'redis'`
- Adds deps: `@nestjs/bullmq`, `bullmq`
- Adds env: `REDIS_HOST`, `REDIS_PORT` (shared with redis plugin)
- Registers: `QueueModule`

- [ ] **Step 2: Implement Mailer plugin**

- Adds deps: `@nestjs-modules/mailer`, `nodemailer`, `@types/nodemailer`
- Adds env: `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASS`
- Registers: `MailerModule`

- [ ] **Step 3: Implement Upload S3 and Upload Local plugins**

S3:
- Adds deps: `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`, `multer`, `@types/multer`
- Adds env: `AWS_S3_BUCKET`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`
- Registers: `UploadModule`

Local:
- Adds deps: `multer`, `@types/multer`
- Registers: `UploadModule`
- Creates `uploads/` directory

- [ ] **Step 4: Write tests, run, verify pass**

- [ ] **Step 5: Update plugins/index.ts, commit**

```bash
git add src/plugins/
git commit -m "feat: add bullmq, mailer, upload-s3, upload-local plugins"
```

---

## Phase 5: Integration & Polish

### Task 18: E2E Test — Full Generation Flow

**Files:**
- Create: `tests/e2e/generate.test.ts`

- [ ] **Step 1: Write E2E test**

```ts
// tests/e2e/generate.test.ts
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

  it('should generate a complete project with all plugins', async () => {
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

    // Verify project structure
    expect(await fs.pathExists(path.join(projectPath, 'src/main.ts'))).toBe(true)
    expect(await fs.pathExists(path.join(projectPath, 'src/app.module.ts'))).toBe(true)
    expect(await fs.pathExists(path.join(projectPath, 'src/prisma/prisma.module.ts'))).toBe(true)
    expect(await fs.pathExists(path.join(projectPath, 'src/auth/auth.module.ts'))).toBe(true)
    expect(await fs.pathExists(path.join(projectPath, 'prisma/schema.prisma'))).toBe(true)
    expect(await fs.pathExists(path.join(projectPath, 'docker-compose.yml'))).toBe(true)
    expect(await fs.pathExists(path.join(projectPath, 'Dockerfile'))).toBe(true)
    expect(await fs.pathExists(path.join(projectPath, '.env.example'))).toBe(true)

    // Verify package.json has all deps
    const pkg = await fs.readJSON(path.join(projectPath, 'package.json'))
    expect(pkg.dependencies).toHaveProperty('@prisma/client')
    expect(pkg.dependencies).toHaveProperty('@nestjs/jwt')
    expect(pkg.dependencies).toHaveProperty('@nestjs/bullmq')

    // Verify app.module.ts has wired modules
    const appModule = await fs.readFile(path.join(projectPath, 'src/app.module.ts'), 'utf-8')
    expect(appModule).toContain('PrismaModule')
    expect(appModule).toContain('AuthModule')

    // Verify .env.example has all vars
    const envContent = await fs.readFile(path.join(projectPath, '.env.example'), 'utf-8')
    expect(envContent).toContain('DATABASE_URL')
    expect(envContent).toContain('JWT_SECRET')
    expect(envContent).toContain('REDIS_HOST')

    // Verify docker-compose has services
    const dockerCompose = await fs.readFile(path.join(projectPath, 'docker-compose.yml'), 'utf-8')
    expect(dockerCompose).toContain('postgres')
    expect(dockerCompose).toContain('redis')
  })

  it('should generate a minimal project with no plugins', async () => {
    const minimalSelections: UserSelections = {
      ...fullSelections,
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
      selections: { ...minimalSelections, projectName: 'minimal-project' },
      skeletonsDir: path.resolve(import.meta.dirname, '../../src/skeletons'),
      selectedPlugins: [],
      skipInstall: true,
      skipGit: true,
      skipFormat: true,
    })

    expect(await fs.pathExists(path.join(projectPath, 'src/main.ts'))).toBe(true)
    expect(await fs.pathExists(path.join(projectPath, 'package.json'))).toBe(true)
  })
})
```

- [ ] **Step 2: Run test, verify pass**

Run: `npx vitest run tests/e2e/generate.test.ts`
Expected: 2 tests PASS

- [ ] **Step 3: Commit**

```bash
git add tests/
git commit -m "test: add E2E test for full project generation"
```

---

### Task 19: Build & Publish Setup

**Files:**
- Modify: `package.json`
- Create: `README.md`

- [ ] **Step 1: Verify build works**

```bash
npm run build
```

Expected: `dist/cli.js` created successfully.

- [ ] **Step 2: Test locally**

```bash
node dist/cli.js test-project
```

Verify interactive prompts appear and project is generated.

- [ ] **Step 3: Add README.md**

Create a README with:
- Installation: `npx quickstart-nestjs my-project`
- Features list
- Available plugins table
- Contributing guide (how to add a plugin)

- [ ] **Step 4: Run all tests**

```bash
npm test
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add README.md package.json
git commit -m "docs: add README and finalize build setup"
```

---

## Summary

| Phase | Tasks | Description |
|-------|-------|-------------|
| 1 | 1-7 | Project setup + core system (types, renderer, wirer, context, registry, engine) |
| 2 | 8-9 | Skeleton templates (monolith + monorepo) |
| 3 | 10-11 | CLI (prompts, summary, entry point) |
| 4 | 12-17 | All 18 plugins across 6 categories |
| 5 | 18-19 | E2E testing + build/publish |

**Parallelization opportunities:**
- Tasks 8 & 9 (skeletons) can run in parallel
- Tasks 12-17 (plugins) can run in parallel after Phase 1 core is complete
- Task 10 & 11 (CLI) can run in parallel with Phase 2

**Total: 19 tasks, ~40 commits**
