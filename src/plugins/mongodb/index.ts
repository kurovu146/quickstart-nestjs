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
