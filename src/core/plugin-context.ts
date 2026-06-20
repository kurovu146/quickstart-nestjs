// src/core/plugin-context.ts
import fs from 'fs-extra'
import path from 'path'
import type {
  PluginContext,
  UserSelections,
  ProjectStructure,
  DockerServiceConfig,
  ModuleRegistration,
} from './types.js'
import { TemplateRenderer } from './template-renderer.js'

interface PluginContextOptions {
  projectName: string
  projectPath: string
  structure: ProjectStructure
  selections: UserSelections
  pluginsDir?: string
}

export class PluginContextImpl implements PluginContext {
  readonly projectName: string
  readonly projectPath: string
  readonly structure: ProjectStructure
  readonly selections: UserSelections
  readonly pluginsDir: string

  private deps: Record<string, string> = {}
  private devDeps: Record<string, string> = {}
  private _scripts: Record<string, string> = {}
  private _modules: ModuleRegistration[] = []
  private _providers: ModuleRegistration[] = []
  private _envVars: Record<string, string> = {}
  private _dockerServices: Record<string, DockerServiceConfig> = {}
  private renderer = new TemplateRenderer()

  constructor(options: PluginContextOptions) {
    this.projectName = options.projectName
    this.projectPath = options.projectPath
    this.structure = options.structure
    this.selections = options.selections
    this.pluginsDir = options.pluginsDir || ''
  }

  /**
   * Map a plugin-relative destination onto the correct source root.
   * Plugins author paths against a monolith layout (e.g. "src/auth"), but in a
   * monorepo the application code lives under "apps/api/src". Without this remap
   * plugin files land in "<root>/src" while app.module.ts (in apps/api/src)
   * imports "./auth/..." → unresolved → the generated project fails to build.
   * Registered module import paths stay relative to app.module.ts, so only the
   * physical destination needs remapping.
   */
  private resolveDest(dest: string): string {
    if (this.structure === 'monorepo') {
      if (dest === 'src') return 'apps/api/src'
      if (dest.startsWith('src/')) return 'apps/api/' + dest
    }
    return dest
  }

  copyTemplates(source: string, dest?: string): void {
    const target = dest
      ? path.join(this.projectPath, this.resolveDest(dest))
      : this.projectPath
    fs.copySync(source, target, { overwrite: true })
  }

  async renderTemplate(
    source: string,
    dest: string,
    data: Record<string, unknown>,
  ): Promise<void> {
    const outputPath = path.join(this.projectPath, this.resolveDest(dest))
    await this.renderer.renderToFile(source, outputPath, data)
  }

  addDependencies(deps: Record<string, string>): void {
    Object.assign(this.deps, deps)
  }

  addDevDependencies(deps: Record<string, string>): void {
    Object.assign(this.devDeps, deps)
  }

  addScripts(scripts: Record<string, string>): void {
    Object.assign(this._scripts, scripts)
  }

  registerModule(moduleName: string, importPath: string): void {
    this._modules.push({ moduleName, importPath })
  }

  registerProvider(providerName: string, importPath: string): void {
    this._providers.push({ moduleName: providerName, importPath })
  }

  addEnvVars(vars: Record<string, string>): void {
    Object.assign(this._envVars, vars)
  }

  addDockerService(name: string, config: DockerServiceConfig): void {
    this._dockerServices[name] = config
  }

  getDependencies(): Record<string, string> {
    return { ...this.deps }
  }

  getDevDependencies(): Record<string, string> {
    return { ...this.devDeps }
  }

  getScripts(): Record<string, string> {
    return { ...this._scripts }
  }

  getModules(): ModuleRegistration[] {
    return [...this._modules]
  }

  getProviders(): ModuleRegistration[] {
    return [...this._providers]
  }

  getEnvVars(): Record<string, string> {
    return { ...this._envVars }
  }

  getDockerServices(): Record<string, DockerServiceConfig> {
    return { ...this._dockerServices }
  }
}
