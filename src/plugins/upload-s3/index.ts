import path from 'path'
import { definePlugin } from '../../core/types.js'

export const uploadS3Plugin = definePlugin({
  name: 'upload-s3',
  category: 'upload',
  displayName: 'S3 Upload',
  description: 'File upload to AWS S3',
  conflicts: ['upload-local'],
  install: async (ctx) => {
    const templateDir = path.join(ctx.pluginsDir, 'upload-s3/templates')
    ctx.copyTemplates(path.join(templateDir, 'src'), 'src')

    ctx.addDependencies({
      '@aws-sdk/client-s3': '^3.0.0',
      '@aws-sdk/s3-request-presigner': '^3.0.0',
      multer: '^1.4.5-lts.1',
    })
    ctx.addDevDependencies({
      '@types/multer': '^1.4.12',
    })
    ctx.addEnvVars({
      AWS_S3_BUCKET: 'my-bucket',
      AWS_ACCESS_KEY_ID: 'your-access-key',
      AWS_SECRET_ACCESS_KEY: 'your-secret-key',
      AWS_REGION: 'us-east-1',
    })
    ctx.registerModule('UploadModule', './upload/upload.module')
  },
})
