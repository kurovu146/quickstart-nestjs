# quickstart-nestjs — Design Spec

## Overview

A CLI tool published on npm that scaffolds production-ready NestJS projects through interactive prompts. Users select services (database, ORM, auth, caching, etc.) and the tool generates a fully working NestJS project with all selected services wired together.

**Usage:** `npx quickstart-nestjs my-project`

## Goals

- Interactive prompts guide users through service selection
- Plugin architecture makes adding new services trivial (add a folder, no core changes)
- Generated code follows standard NestJS conventions
- Output is a runnable project, not an empty skeleton
- Smart filtering: incompatible options are hidden automatically
- Support both monolith and monorepo project structures

## CLI Flow

### Interactive Prompts (in order)

1. **Project name** — default from CLI arg or current directory name
2. **Project structure** — Monolith / Monorepo
3. **Package manager** — npm / yarn / pnpm / bun
4. **Database** — PostgreSQL / MySQL / MongoDB / SQLite / None
5. **ORM** — Prisma / TypeORM / Sequelize / Mongoose (filtered by DB selection)
6. **Authentication** — JWT / None
7. **Caching** — Redis / None
8. **Realtime** — Socket.io / WebSocket / None
9. **API Docs** — Swagger / None
10. **Docker** — Yes / No
11. **Logger** — Pino / Winston / Default
12. **Queue** — BullMQ / None
13. **Mailer** — Nodemailer / None
14. **Upload** — S3 / Local / None

### Smart Filtering Rules

- MongoDB selected → ORM shows only Mongoose, Prisma (with warning)
- No DB selected → skip ORM, skip Auth
- No Redis selected → BullMQ hidden
- JWT selected → requires an ORM (needs User model)

### Post-selection

- Display summary of all selections
- User confirms → generation begins
- User declines → re-enter prompts

## Plugin System Architecture

### Plugin Interface

```ts
interface PluginDefinition {
  name: string
  category: 'database' | 'orm' | 'auth' | 'cache' | 'realtime' | 'docs' | 'infra' | 'logger' | 'queue' | 'mailer' | 'upload'
  displayName: string
  description: string
  conflicts?: string[]
  requires?: string[]
  optionalDeps?: string[]
  isCompatible?: (selections: UserSelections) => boolean
  prompts?: (selections: UserSelections) => PromptQuestion[]
  install: (ctx: PluginContext) => Promise<void>
}
```

### Plugin Context API

```ts
interface PluginContext {
  projectName: string
  projectPath: string
  structure: 'monolith' | 'monorepo'
  selections: UserSelections

  // File operations
  copyTemplates(source: string, dest?: string): void
  renderTemplate(source: string, dest: string, data: Record<string, any>): void

  // Package.json
  addDependencies(deps: Record<string, string>): void
  addDevDependencies(deps: Record<string, string>): void
  addScripts(scripts: Record<string, string>): void

  // NestJS module wiring
  registerModule(moduleName: string, importPath: string): void
  registerProvider(providerName: string, importPath: string): void

  // Config
  addEnvVars(vars: Record<string, string>): void
  addDockerService(name: string, config: DockerServiceConfig): void
}
```

### Plugin Discovery

- `plugin-registry.ts` scans the `plugins/` directory
- Each plugin folder contains `index.ts` exporting a `definePlugin()` call
- Registry auto-discovers, validates, and indexes all plugins at startup

### Conflict & Dependency Resolution

**Conflict rules (same category, pick one):**
- ORM: prisma | typeorm | sequelize | mongoose
- Database: postgres | mysql | mongodb | sqlite
- Logger: pino | winston
- Upload: upload-s3 | upload-local

**Dependency rules:**
- mongoose → requires mongodb
- prisma → requires postgres | mysql | sqlite
- typeorm → requires postgres | mysql | sqlite | mongodb
- sequelize → requires postgres | mysql | sqlite
- jwt → requires any ORM
- bullmq → requires redis

**Install order:** Topological sort by dependency graph:
```
database → orm → auth → cache → realtime → queue → mailer → upload → docs → infra → logger
```

Circular dependencies throw an error at development time.

## Generator Engine

Execution steps after user confirms selections:

1. Create project directory
2. Copy base skeleton (monolith or monorepo)
3. Resolve plugin install order (topological sort)
4. Run each plugin's `install()` sequentially
5. Merge all `package.json` changes (deps, devDeps, scripts)
6. Aggregate `.env.example` from all plugin env vars
7. Aggregate `docker-compose.yml` from all plugin docker services
8. Wire all registered modules into `app.module.ts`
9. Install dependencies via selected package manager
10. Format all generated code with Prettier
11. Initialize git repository with initial commit

### Module Wiring

`module-wirer.ts` handles injecting imports and module registrations into `app.module.ts`. Uses regex-based parsing — NestJS module format is predictable enough that full AST parsing is unnecessary.

### Template Rendering

EJS templates with data injection:
```ejs
// Example: prisma/schema.prisma
datasource db {
  provider = "<%= dbProvider %>"
  url      = env("DATABASE_URL")
}
```

## Source Code Structure (CLI Tool)

```
quickstart-nestjs/
  bin/
    cli.ts                        # entry point (#!/usr/bin/env node)
  src/
    cli/
      prompts.ts                  # interactive prompts logic
      summary.ts                  # show selection summary
    core/
      engine.ts                   # generator orchestrator
      plugin-registry.ts          # scan, resolve, sort plugins
      plugin-context.ts           # PluginContext implementation
      template-renderer.ts        # EJS render engine
      module-wirer.ts             # inject imports into app.module.ts
      types.ts                    # shared interfaces
    plugins/
      postgres/
        index.ts
        templates/
      mysql/
        index.ts
        templates/
      mongodb/
        index.ts
        templates/
      sqlite/
        index.ts
        templates/
      prisma/
        index.ts
        templates/
          src/prisma/prisma.module.ts
          src/prisma/prisma.service.ts
          prisma/schema.prisma
      typeorm/
        index.ts
        templates/
      sequelize/
        index.ts
        templates/
      mongoose/
        index.ts
        templates/
      jwt/
        index.ts
        templates/
          src/auth/auth.module.ts
          src/auth/auth.controller.ts
          src/auth/auth.service.ts
          src/auth/guards/jwt-auth.guard.ts
          src/auth/strategies/jwt.strategy.ts
          src/auth/dto/login.dto.ts
          src/auth/dto/register.dto.ts
      redis/
        index.ts
        templates/
      socket-io/
        index.ts
        templates/
      websocket/
        index.ts
        templates/
      swagger/
        index.ts
        templates/
      docker/
        index.ts
        templates/
          Dockerfile
          .dockerignore
      pino/
        index.ts
        templates/
      winston/
        index.ts
        templates/
      bullmq/
        index.ts
        templates/
      mailer/
        index.ts
        templates/
      upload-s3/
        index.ts
        templates/
      upload-local/
        index.ts
        templates/
    skeletons/
      monolith/
        src/
          app.module.ts
          main.ts
          common/
            decorators/
            filters/
            interceptors/
        .env.example
        .prettierrc
        tsconfig.json
        tsconfig.build.json
        nest-cli.json
      monorepo/
        apps/
          api/
            src/
              main.ts
              app.module.ts
        libs/
          common/
            src/
        nest-cli.json
  package.json
  tsconfig.json
```

## Generated Project Structure

### Monolith (PostgreSQL + Prisma + JWT + Redis + Socket.io + Swagger + Docker + Pino)

```
my-project/
  src/
    app.module.ts
    main.ts
    common/
      decorators/
        public.decorator.ts
        current-user.decorator.ts
      filters/
        http-exception.filter.ts
      interceptors/
        transform.interceptor.ts
        logging.interceptor.ts
    config/
      app.config.ts
    prisma/
      prisma.module.ts
      prisma.service.ts
    auth/
      auth.module.ts
      auth.controller.ts
      auth.service.ts
      dto/
        login.dto.ts
        register.dto.ts
      guards/
        jwt-auth.guard.ts
      strategies/
        jwt.strategy.ts
    users/
      users.module.ts
      users.controller.ts
      users.service.ts
      dto/
        create-user.dto.ts
    cache/
      cache.module.ts
    gateway/
      app.gateway.ts
      gateway.module.ts
  prisma/
    schema.prisma
  docker/
    Dockerfile
    .dockerignore
  docker-compose.yml
  .env.example
  .env
  .prettierrc
  .eslintrc.js
  nest-cli.json
  tsconfig.json
  tsconfig.build.json
  package.json
  README.md
```

### Monorepo

```
my-project/
  apps/
    api/
      src/
        main.ts
        app.module.ts
        auth/
        users/
        gateway/
  libs/
    common/
      src/
        decorators/
        filters/
        interceptors/
    database/
      src/
        prisma.module.ts
        prisma.service.ts
    cache/
      src/
        cache.module.ts
  prisma/
    schema.prisma
  docker-compose.yml
  .env.example
  nest-cli.json
  package.json
```

## Tech Stack (CLI Tool)

| Component | Choice | Reason |
|-----------|--------|--------|
| Runtime | Node.js (TypeScript) | NestJS ecosystem alignment |
| CLI framework | Commander.js | Lightweight, stable |
| Interactive prompts | Inquirer.js | Rich prompt types, mature |
| Template engine | EJS | Simple, sufficient |
| File operations | fs-extra | Copy, write, ensureDir |
| Code formatting | Prettier (API) | Format generated code |
| CLI styling | chalk + ora | Colors + spinners |
| Build | tsup | Fast CLI bundler |
| Test | Vitest | Fast, snapshot testing |

## Testing Strategy

- **Unit tests:** Each plugin tested in isolation — mock PluginContext, verify correct files/deps/modules registered
- **Snapshot tests:** Generate project with a combination → snapshot file tree and key files
- **E2E tests:** Generate → install → build → verify build succeeds

## Publishing

- Package name: `quickstart-nestjs`
- Registry: npm
- Binary: `quickstart-nestjs` via `bin` field in package.json
- Versioning: Semver — new plugin = minor, breaking plugin interface change = major

## Future Extensibility

Adding a new service requires only:
1. Create a new folder under `plugins/`
2. Implement `definePlugin()` with the standard interface
3. Add template files
4. No core code changes needed
