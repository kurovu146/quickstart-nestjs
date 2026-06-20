import path from 'path'
import { definePlugin } from '../../core/types.js'

export const mailerPlugin = definePlugin({
  name: 'mailer',
  category: 'mailer',
  displayName: 'Nodemailer',
  description: 'Email sending with Nodemailer',
  conflicts: [],
  install: async (ctx) => {
    const templateDir = path.join(ctx.pluginsDir, 'mailer/templates')
    ctx.copyTemplates(path.join(templateDir, 'src'), 'src')

    ctx.addDependencies({
      '@nestjs-modules/mailer': '^2.0.0',
      // @nestjs-modules/mailer@2 requires nodemailer >=8.0.5 as a peer; the old
      // ^6.9.0 pin made `npm install` fail with ERESOLVE.
      nodemailer: '^9.0.0',
    })
    ctx.addDevDependencies({
      '@types/nodemailer': '^6.4.0',
    })
    ctx.addEnvVars({
      MAIL_HOST: 'smtp.example.com',
      MAIL_PORT: '587',
      MAIL_USER: 'user@example.com',
      MAIL_PASS: 'password',
    })
    ctx.registerModule('AppMailerModule', './mailer/mailer.module')
  },
})
