// src/core/__tests__/template-renderer.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs-extra'
import path from 'path'
import { TemplateRenderer } from '../template-renderer.js'

const TEST_DIR = path.join(import.meta.dirname, '.tmp-template-test')

describe('TemplateRenderer', () => {
  let renderer: TemplateRenderer

  beforeEach(async () => {
    renderer = new TemplateRenderer()
    await fs.ensureDir(TEST_DIR)
  })

  afterEach(async () => {
    await fs.remove(TEST_DIR)
  })

  it('should copy a directory recursively', async () => {
    const srcDir = path.join(TEST_DIR, 'source')
    await fs.ensureDir(path.join(srcDir, 'sub'))
    await fs.writeFile(path.join(srcDir, 'file.txt'), 'hello')
    await fs.writeFile(path.join(srcDir, 'sub', 'nested.txt'), 'world')

    const destDir = path.join(TEST_DIR, 'dest')
    await renderer.copyDir(srcDir, destDir)

    expect(await fs.readFile(path.join(destDir, 'file.txt'), 'utf-8')).toBe('hello')
    expect(await fs.readFile(path.join(destDir, 'sub', 'nested.txt'), 'utf-8')).toBe('world')
  })

  it('should render an EJS template to a file', async () => {
    const templatePath = path.join(TEST_DIR, 'template.ejs')
    await fs.writeFile(templatePath, 'Hello, <%= name %>! Port: <%= port %>')

    const outputPath = path.join(TEST_DIR, 'output.txt')
    await renderer.renderToFile(templatePath, outputPath, { name: 'World', port: 3000 })

    expect(await fs.readFile(outputPath, 'utf-8')).toBe('Hello, World! Port: 3000')
  })

  it('should render an EJS string directly', () => {
    const result = renderer.renderString('DB: <%= provider %>', { provider: 'postgresql' })
    expect(result).toBe('DB: postgresql')
  })
})
