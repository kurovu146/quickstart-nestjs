<div align="center">

# ⚡ quickstart-nestjs

### Spin up a production-ready NestJS API in seconds — not days.

An interactive CLI that scaffolds a fully-wired NestJS project: pick your database, ORM, auth, cache, queue and more, and get a project that **installs, builds, and boots** out of the box.

[![npm version](https://img.shields.io/npm/v/quickstart-nestjs.svg?color=e0234e&label=npm)](https://www.npmjs.com/package/quickstart-nestjs)
[![license](https://img.shields.io/badge/license-MIT-green.svg)](./LICENSE)
[![node](https://img.shields.io/badge/node-%E2%89%A518-brightgreen.svg)](https://nodejs.org)
[![built with NestJS](https://img.shields.io/badge/built%20with-NestJS-e0234e.svg)](https://nestjs.com)

</div>

---

## 🚀 Get started in one command

```bash
npx quickstart-nestjs my-project
```

Prefer a global install? Do it once, then call it anywhere:

```bash
npm install -g quickstart-nestjs
quickstart-nestjs my-project
```

That's it. Answer a few prompts and you'll have a running NestJS app with dependencies installed, git initialized, and every module wired together.

```text
⚡ quickstart-nestjs
Scaffold production-ready NestJS projects

✔ Project structure       › Monolith
✔ Package manager         › npm
✔ Database                › PostgreSQL
✔ ORM                     › Prisma
✔ Authentication          › JWT
✔ Caching                 › Redis
✔ API Documentation       › Swagger
✔ Docker support          › Yes

✔ Project scaffolded!
✔ Dependencies installed!
✔ Git repository initialized!
```

---

## ✨ Why you'll like it

- **🧠 Smart prompts, zero flags** — incompatible options are hidden as you go, so you can't build a combo that won't work.
- **🔋 Batteries included** — auth, caching, queues, websockets, docs, logging, file uploads… all pre-wired.
- **🔐 Auth that actually works** — JWT register/login with a real, ORM-backed user store (Prisma, TypeORM, Sequelize, or Mongoose), global guard, and `@Public()` opt-out.
- **🐳 Instant infrastructure** — generates a `docker-compose.yml` for your database, Redis and friends, plus handy `db:up` / `db:down` scripts.
- **🏗️ Monolith or monorepo** — pick the structure that fits, with the NestJS CLI configured for both.
- **✅ Verified end-to-end** — every database/ORM combination is tested to install, build, and boot before release.
- **📦 Your package manager** — npm, yarn, pnpm, or bun.

---

## 🧩 Available plugins

**20 plugins across 11 categories** — mix and match freely.

| Category | Plugins |
|----------|---------|
| 🗄️ **Database** | PostgreSQL · MySQL · MongoDB · SQLite |
| 🔗 **ORM** | Prisma · TypeORM · Sequelize · Mongoose |
| 🔐 **Auth** | JWT (Passport) |
| ⚡ **Cache** | Redis |
| 🔌 **Realtime** | Socket.io · Native WebSocket |
| 📚 **Docs** | Swagger / OpenAPI |
| 🐳 **Infra** | Docker |
| 📝 **Logger** | Pino · Winston |
| 📬 **Queue** | BullMQ |
| ✉️ **Mailer** | Nodemailer |
| 📁 **Upload** | AWS S3 · Local (Multer) |

---

## 🪄 Smart compatibility filtering

Each plugin declares what it conflicts with or requires, and the prompts adapt to your previous answers:

- ORMs only appear after you choose a database — Mongoose for MongoDB, relational ORMs for SQL.
- JWT auth is offered only once an ORM is selected (it needs a user store).
- BullMQ shows up only after you pick Redis (its queue backend).

You never see an option that can't work with what you've already chosen.

---

## 📂 What gets generated

Example output for a **monolith** with PostgreSQL + Prisma + JWT + Swagger + Docker:

```text
my-project/
├── src/
│   ├── main.ts                     # CORS, validation, Swagger wired up
│   ├── app.module.ts               # global filter + interceptor + config
│   ├── auth/                       # register / login / profile, global JWT guard
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── guards/jwt-auth.guard.ts
│   │   └── strategies/jwt.strategy.ts
│   ├── users/                      # real ORM-backed UsersService
│   │   ├── users.module.ts
│   │   └── users.service.ts
│   ├── prisma/                     # PrismaModule + PrismaService
│   ├── common/                     # @Public, exception filter, transform interceptor
│   └── config/
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── docker-compose.yml              # postgres service + named volumes
├── .env / .env.example
├── .gitignore
├── nest-cli.json
├── tsconfig.json
└── package.json                    # db:up, db:down, start:dev, ...
```

Then just:

```bash
cd my-project
npm run db:up        # start the database with Docker
npx prisma migrate dev --name init
npm run start:dev    # 🎉 http://localhost:3000  ·  docs at /api
```

---

## 🏛️ Project structures

- **Monolith** — a single NestJS application with everything under `src/`. Best for most projects.
- **Monorepo** — multiple apps under `apps/` with shared libraries in `libs/`, managed by NestJS monorepo mode. Best when you ship several services (e.g. API + worker) from one repo.

---

## 🛠️ Local development

```bash
git clone https://github.com/kurovu146/quickstart-nestjs.git
cd quickstart-nestjs
npm install

npm run dev                          # watch mode
npm run build && node dist/cli.js my-project   # run locally
npm test                             # run the test suite
npm run lint                         # prettier --check
```

---

## 🤝 Contributing

Want to add a plugin? It takes three small steps.

1. Create `src/plugins/<plugin-name>/` with an `index.ts`:

   ```typescript
   import { definePlugin } from '../../core/types.js'

   export const myPlugin = definePlugin({
     name: 'my-plugin',
     category: 'cache',                 // one of the PluginCategory values
     displayName: 'My Plugin',
     description: 'Short description shown in the prompt',
     conflicts: ['other-plugin'],       // optional
     requires: ['redis'],               // optional — install after these
     isCompatible: (sel) => sel.cache === 'redis', // optional filter
     install: async (ctx) => {
       ctx.addDependencies({ 'my-package': '^1.0.0' })
       ctx.addEnvVars({ MY_VAR: 'default' })
       ctx.registerModule('MyModule', './my/my.module')
     },
   })
   ```

2. Add any source templates under `src/plugins/<plugin-name>/templates/`.

3. Register it in `src/plugins/index.ts`:

   ```typescript
   import { myPlugin } from './my-plugin/index.js'
   registry.register(myPlugin)
   ```

Issues and PRs are welcome → [github.com/kurovu146/quickstart-nestjs](https://github.com/kurovu146/quickstart-nestjs/issues)

---

## 📄 License

[MIT](./LICENSE) © Vũ Đức Tuấn ([@kurovu146](https://github.com/kurovu146))
