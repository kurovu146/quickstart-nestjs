import path from 'path'
import { definePlugin } from '../../core/types.js'

export const jwtPlugin = definePlugin({
  name: 'jwt',
  category: 'auth',
  displayName: 'JWT',
  description: 'JSON Web Token authentication with Passport',
  conflicts: [],
  requires: ['prisma', 'typeorm', 'sequelize', 'mongoose'],
  isCompatible: (sel) => sel.orm !== null,
  install: async (ctx) => {
    const templateDir = path.join(ctx.pluginsDir, 'jwt/templates')
    ctx.copyTemplates(path.join(templateDir, 'src'), 'src')

    ctx.addDependencies({
      '@nestjs/jwt': '^11.0.0',
      '@nestjs/passport': '^11.0.0',
      passport: '^0.7.0',
      'passport-jwt': '^4.0.1',
      bcrypt: '^5.1.1',
    })
    ctx.addDevDependencies({
      '@types/passport-jwt': '^4.0.1',
      '@types/bcrypt': '^5.0.2',
    })
    ctx.addEnvVars({
      JWT_SECRET: 'your-secret-key-change-in-production',
      JWT_EXPIRES_IN: '7d',
    })
    ctx.registerModule('AuthModule', './auth/auth.module')
    ctx.registerModule('UsersModule', './users/users.module')
  },
})
