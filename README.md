# quickstart-nestjs

[![npm version](https://img.shields.io/npm/v/quickstart-nestjs.svg)](https://www.npmjs.com/package/quickstart-nestjs)
[![license](https://img.shields.io/npm/l/quickstart-nestjs.svg)](https://github.com/kurovu146/quickstart-nestjs/blob/main/LICENSE)

CLI tool that scaffolds production-ready NestJS projects through interactive prompts.

## Quick Start

```bash
npx quickstart-nestjs my-project
```

You will be prompted to choose a project structure, package manager, and any combination of plugins. The tool installs dependencies and wires everything together automatically.

## Features

- Interactive prompt-driven setup — no flags to memorize
- 20 plugins across 11 categories (database, ORM, auth, cache, realtime, docs, infra, logger, queue, mailer, upload)
- Smart compatibility filtering — incompatible options are hidden based on prior selections
- Monolith and monorepo project structures
- Auto-generates `.env`, `docker-compose.yml`, and NestJS module wiring
- Supports npm, yarn, pnpm, and bun

## Available Plugins

| Name | Category | Description |
|------|----------|-------------|
| PostgreSQL | Database | Powerful, open source relational database |
| MySQL | Database | Popular open source relational database |
| MongoDB | Database | NoSQL document database |
| SQLite | Database | Embedded file-based relational database |
| Prisma | ORM | Next-generation ORM with type-safe client |
| TypeORM | ORM | ORM for TypeScript with decorator support |
| Sequelize | ORM | Promise-based ORM for relational databases |
| Mongoose | ORM | Elegant MongoDB ODM |
| JWT | Auth | JSON Web Token authentication with Passport |
| Redis | Cache | In-memory data store for caching |
| Socket.io | Realtime | Event-driven bidirectional communication |
| WebSocket | Realtime | Native NestJS WebSocket gateway |
| Swagger | Docs | OpenAPI documentation via `@nestjs/swagger` |
| Docker | Infra | `docker-compose.yml` with selected services |
| Pino | Logger | Fast, low-overhead JSON logger |
| Winston | Logger | Versatile multi-transport logger |
| BullMQ | Queue | Redis-based queue for background jobs |
| Nodemailer | Mailer | Email sending via SMTP |
| S3 Upload | Upload | File upload to AWS S3 |
| Local Upload | Upload | File upload to local disk via Multer |

## Project Structures

**Monolith** — a single NestJS application. All source lives under `src/`. Best for most projects.

**Monorepo** — multiple apps under `apps/` with shared libraries under `libs/`. Managed by the NestJS CLI monorepo mode. Best when you need to ship multiple services (e.g., API + worker) from one repository.

## Smart Filtering

Each plugin declares which other plugins it conflicts with or requires. At prompt time, `getCompatible()` filters the available choices based on what you have already selected:

- ORM choices are only shown after you pick a database. Mongoose appears only if you chose MongoDB; relational ORMs appear only for SQL databases.
- JWT auth is only offered after you select an ORM (it needs a user store).
- BullMQ is only shown after you select Redis (it depends on it as a queue backend).

This means you never see an option that cannot work with your current selections.

## Generated Project Structure

Example output for a monolith project with PostgreSQL + Prisma + JWT + Swagger + Docker:

```
my-project/
├── src/
│   ├── app.module.ts
│   ├── app.controller.ts
│   ├── app.service.ts
│   ├── main.ts
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.service.ts
│   │   └── strategies/jwt.strategy.ts
│   ├── users/
│   │   ├── users.module.ts
│   │   └── users.service.ts
│   ├── prisma/
│   │   ├── prisma.module.ts
│   │   └── prisma.service.ts
│   ├── common/
│   │   ├── decorators/public.decorator.ts
│   │   ├── filters/http-exception.filter.ts
│   │   └── interceptors/transform.interceptor.ts
│   └── config/
│       └── app.config.ts
├── prisma/
│   └── schema.prisma
├── docker-compose.yml
├── .env
├── nest-cli.json
├── tsconfig.json
└── package.json
```

## Development

```bash
git clone https://github.com/kurovu146/quickstart-nestjs.git
cd quickstart-nestjs
npm install

# Watch mode
npm run dev

# Run locally
npm run build && node dist/cli.js my-project

# Run tests
npm test

# Lint & format
npm run lint
npm run format
```

## Contributing

### Adding a New Plugin

1. Create a folder under `src/plugins/<plugin-name>/`.

2. Add an `index.ts` that calls `definePlugin()`:

   ```typescript
   import { definePlugin } from '../../core/types.js'

   export const myPlugin = definePlugin({
     name: 'my-plugin',
     category: 'cache',          // one of the PluginCategory values
     displayName: 'My Plugin',
     description: 'Short description shown in the prompt',
     conflicts: ['other-plugin'], // optional
     requires: ['redis'],         // optional — install after these
     isCompatible: (sel) => sel.cache === 'redis', // optional filter
     install: async (ctx) => {
       ctx.addDependencies({ 'my-package': '^1.0.0' })
       ctx.addEnvVars({ MY_VAR: 'default' })
       ctx.registerModule('MyModule', './my/my.module')
     },
   })
   ```

3. Add EJS templates under `src/plugins/<plugin-name>/templates/` if the plugin copies source files.

4. Register the plugin in `src/plugins/index.ts`:

   ```typescript
   import { myPlugin } from './my-plugin/index.js'
   // ...
   registry.register(myPlugin)
   ```

## License

MIT
