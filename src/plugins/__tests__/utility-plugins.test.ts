import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs-extra'
import path from 'path'
import { bullmqPlugin } from '../bullmq/index.js'
import { mailerPlugin } from '../mailer/index.js'
import { uploadS3Plugin } from '../upload-s3/index.js'
import { uploadLocalPlugin } from '../upload-local/index.js'
import { PluginContextImpl } from '../../core/plugin-context.js'
import type { UserSelections } from '../../core/types.js'

const TEST_DIR = path.join(import.meta.dirname, '.tmp-utility-plugins')

const baseSelections: UserSelections = {
  projectName: 'test',
  structure: 'monolith',
  packageManager: 'npm',
  database: null,
  orm: null,
  auth: null,
  cache: null,
  realtime: null,
  docs: null,
  docker: false,
  logger: null,
  queue: null,
  mailer: null,
  upload: null,
}

function createCtx(overrides: Partial<UserSelections> = {}) {
  return new PluginContextImpl({
    projectName: 'test',
    projectPath: TEST_DIR,
    structure: 'monolith',
    selections: { ...baseSelections, ...overrides },
  })
}

describe('Utility plugins', () => {
  beforeEach(() => fs.ensureDir(TEST_DIR))
  afterEach(() => fs.remove(TEST_DIR))

  it('bullmq: should add deps and register module', async () => {
    const ctx = createCtx({ cache: 'redis', queue: 'bullmq' })
    await bullmqPlugin.install(ctx)
    expect(ctx.getDependencies()).toHaveProperty('@nestjs/bullmq')
    expect(ctx.getDependencies()).toHaveProperty('bullmq')
    expect(ctx.getModules()).toContainEqual(expect.objectContaining({ moduleName: 'QueueModule' }))
    expect(await fs.pathExists(path.join(TEST_DIR, 'src/queue/queue.module.ts'))).toBe(true)
  })

  it('bullmq: should only be compatible when redis is selected', () => {
    expect(bullmqPlugin.isCompatible!({ ...baseSelections, cache: 'redis' })).toBe(true)
    expect(bullmqPlugin.isCompatible!({ ...baseSelections, cache: null })).toBe(false)
  })

  it('mailer: should add deps, env vars, and register module', async () => {
    const ctx = createCtx({ mailer: 'mailer' })
    await mailerPlugin.install(ctx)
    expect(ctx.getDependencies()).toHaveProperty('@nestjs-modules/mailer')
    expect(ctx.getDependencies()).toHaveProperty('nodemailer')
    expect(ctx.getEnvVars()).toHaveProperty('MAIL_HOST')
    expect(ctx.getModules()).toContainEqual(expect.objectContaining({ moduleName: 'AppMailerModule' }))
    expect(await fs.pathExists(path.join(TEST_DIR, 'src/mailer/mailer.module.ts'))).toBe(true)
  })

  it('upload-s3: should add deps, env vars, and register module', async () => {
    const ctx = createCtx({ upload: 'upload-s3' })
    await uploadS3Plugin.install(ctx)
    expect(ctx.getDependencies()).toHaveProperty('@aws-sdk/client-s3')
    expect(ctx.getEnvVars()).toHaveProperty('AWS_S3_BUCKET')
    expect(ctx.getModules()).toContainEqual(expect.objectContaining({ moduleName: 'UploadModule' }))
    expect(await fs.pathExists(path.join(TEST_DIR, 'src/upload/upload.module.ts'))).toBe(true)
  })

  it('upload-local: should add deps and register module', async () => {
    const ctx = createCtx({ upload: 'upload-local' })
    await uploadLocalPlugin.install(ctx)
    expect(ctx.getDependencies()).toHaveProperty('multer')
    expect(ctx.getModules()).toContainEqual(expect.objectContaining({ moduleName: 'UploadModule' }))
    expect(await fs.pathExists(path.join(TEST_DIR, 'src/upload/upload.module.ts'))).toBe(true)
  })

  it('upload-s3 and upload-local should conflict', () => {
    expect(uploadS3Plugin.conflicts).toContain('upload-local')
    expect(uploadLocalPlugin.conflicts).toContain('upload-s3')
  })
})
