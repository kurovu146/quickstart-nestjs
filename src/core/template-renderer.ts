// src/core/template-renderer.ts
import fs from 'fs-extra'
import ejs from 'ejs'
import path from 'path'

export class TemplateRenderer {
  async copyDir(source: string, dest: string): Promise<void> {
    await fs.copy(source, dest, { overwrite: true })
  }

  async renderToFile(
    templatePath: string,
    outputPath: string,
    data: Record<string, unknown>,
  ): Promise<void> {
    const template = await fs.readFile(templatePath, 'utf-8')
    const rendered = ejs.render(template, data)
    await fs.ensureDir(path.dirname(outputPath))
    await fs.writeFile(outputPath, rendered, 'utf-8')
  }

  renderString(template: string, data: Record<string, unknown>): string {
    return ejs.render(template, data)
  }
}
