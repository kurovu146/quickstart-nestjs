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
