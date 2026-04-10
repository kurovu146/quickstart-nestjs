import path from 'path'
import { definePlugin } from '../../core/types.js'

export const uploadLocalPlugin = definePlugin({
  name: 'upload-local',
  category: 'upload',
  displayName: 'Local Upload',
  description: 'File upload to local filesystem',
  conflicts: ['upload-s3'],
  install: async (ctx) => {
    const templateDir = path.join(import.meta.dirname, 'templates')
    ctx.copyTemplates(path.join(templateDir, 'src'), 'src')

    ctx.addDependencies({
      multer: '^1.4.5-lts.1',
    })
    ctx.addDevDependencies({
      '@types/multer': '^1.4.12',
    })
    ctx.registerModule('UploadModule', './upload/upload.module')
  },
})
