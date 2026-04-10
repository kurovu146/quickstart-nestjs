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
