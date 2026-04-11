// src/core/engine.ts
import fs from 'fs-extra'
import path from 'path'
import { execSync } from 'child_process'
import type { UserSelections, PackageManager } from './types.js'
import { PluginRegistry } from './plugin-registry.js'
import { PluginContextImpl } from './plugin-context.js'
import { ModuleWirer } from './module-wirer.js'

export interface GenerateOptions {
  outputDir: string
  selections: UserSelections
  skeletonsDir: string
  pluginsDir?: string
  selectedPlugins?: string[]
  skipInstall?: boolean
  skipGit?: boolean
  skipFormat?: boolean
}

export class GeneratorEngine {
  constructor(private registry: PluginRegistry) {}

  async generate(options: GenerateOptions): Promise<string> {
    const { outputDir, selections, skeletonsDir, selectedPlugins = [] } = options
    const projectPath = path.join(outputDir, selections.projectName)

    // 1. Clean and create project directory
    await fs.remove(projectPath)
    await fs.ensureDir(projectPath)

    // 2. Copy base skeleton
    const skeletonDir = path.join(skeletonsDir, selections.structure)
    if (await fs.pathExists(skeletonDir)) {
      await fs.copy(skeletonDir, projectPath, { overwrite: true })
    }

    // 3. Resolve plugin install order
    const orderedPlugins = this.registry.resolveInstallOrder(selectedPlugins)

    // 4. Run each plugin's install()
    const pluginsDir = options.pluginsDir || path.join(path.dirname(skeletonsDir), 'plugins')
    const ctx = new PluginContextImpl({
      projectName: selections.projectName,
      projectPath,
      structure: selections.structure,
      selections,
      pluginsDir,
    })

    for (const pluginName of orderedPlugins) {
      const plugin = this.registry.get(pluginName)
      if (plugin) {
        await plugin.install(ctx)
      }
    }

    // 5. Merge package.json
    await this.mergePackageJson(projectPath, selections.projectName, ctx)

    // 6. Generate .env.example
    await this.generateEnvFile(projectPath, ctx)

    // 7. Generate docker-compose.yml
    const dockerServices = ctx.getDockerServices()
    if (Object.keys(dockerServices).length > 0) {
      await this.generateDockerCompose(projectPath, dockerServices)
    }

    // 8. Wire modules into app.module.ts
    await this.wireModules(projectPath, selections.structure, ctx)

    // 9. Install dependencies
    if (!options.skipInstall) {
      this.installDependencies(projectPath, selections.packageManager)
    }

    // 10. Initialize git repository
    if (!options.skipGit) {
      this.initGit(projectPath)
    }

    return projectPath
  }

  installDependencies(projectPath: string, packageManager: PackageManager): void {
    const installCmd: Record<PackageManager, string> = {
      npm: 'npm install',
      yarn: 'yarn install',
      pnpm: 'pnpm install',
      bun: 'bun install',
    }
    execSync(installCmd[packageManager], {
      cwd: projectPath,
      stdio: 'inherit',
    })
  }

  runPostInstallSteps(
    projectPath: string,
    selections: UserSelections,
    packageManager: PackageManager,
  ): void {
    const execCmd: Record<PackageManager, string> = {
      npm: 'npx',
      yarn: 'yarn',
      pnpm: 'pnpm exec',
      bun: 'bunx',
    }

    if (selections.orm === 'prisma') {
      execSync(`${execCmd[packageManager]} prisma generate`, {
        cwd: projectPath,
        stdio: 'inherit',
      })
    }
  }

  initGit(projectPath: string): void {
    try {
      execSync('git init', { cwd: projectPath, stdio: 'ignore' })
      execSync('git add -A', { cwd: projectPath, stdio: 'ignore' })
      execSync('git commit -m "chore: initial commit from quickstart-nestjs"', {
        cwd: projectPath,
        stdio: 'ignore',
      })
    } catch {
      // Git not available, skip silently
    }
  }

  private async mergePackageJson(
    projectPath: string,
    projectName: string,
    ctx: PluginContextImpl,
  ): Promise<void> {
    const pkgPath = path.join(projectPath, 'package.json')
    let pkg: Record<string, unknown> = {}

    if (await fs.pathExists(pkgPath)) {
      pkg = await fs.readJSON(pkgPath)
    }

    pkg.name = projectName
    pkg.version = '0.0.1'
    pkg.private = true

    const existingDeps = (pkg.dependencies as Record<string, string>) || {}
    const existingDevDeps = (pkg.devDependencies as Record<string, string>) || {}
    const existingScripts = (pkg.scripts as Record<string, string>) || {}

    pkg.dependencies = { ...existingDeps, ...ctx.getDependencies() }
    pkg.devDependencies = { ...existingDevDeps, ...ctx.getDevDependencies() }
    pkg.scripts = { ...existingScripts, ...ctx.getScripts() }

    await fs.writeJSON(pkgPath, pkg, { spaces: 2 })
  }

  private async generateEnvFile(projectPath: string, ctx: PluginContextImpl): Promise<void> {
    const envVars = ctx.getEnvVars()
    if (Object.keys(envVars).length === 0) return

    const content = Object.entries(envVars)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n')

    await fs.writeFile(path.join(projectPath, '.env.example'), content + '\n', 'utf-8')
    await fs.writeFile(path.join(projectPath, '.env'), content + '\n', 'utf-8')
  }

  private async generateDockerCompose(
    projectPath: string,
    services: Record<string, import('./types.js').DockerServiceConfig>,
  ): Promise<void> {
    let yaml = 'services:\n'
    const namedVolumes = new Set<string>()

    for (const [name, config] of Object.entries(services)) {
      yaml += `  ${name}:\n`
      yaml += `    image: ${config.image}\n`

      if (config.restart) {
        yaml += `    restart: ${config.restart}\n`
      }

      if (config.ports?.length) {
        yaml += '    ports:\n'
        for (const port of config.ports) {
          yaml += `      - '${port}'\n`
        }
      }

      if (config.environment) {
        yaml += '    environment:\n'
        for (const [key, value] of Object.entries(config.environment)) {
          yaml += `      ${key}: ${value}\n`
        }
      }

      if (config.volumes?.length) {
        yaml += '    volumes:\n'
        for (const vol of config.volumes) {
          yaml += `      - ${vol}\n`
          // Collect named volumes (format: "name:path", not "./path:path" or "/path:path")
          const volumeName = vol.split(':')[0]
          if (volumeName && !volumeName.startsWith('.') && !volumeName.startsWith('/')) {
            namedVolumes.add(volumeName)
          }
        }
      }

      yaml += '\n'
    }

    if (namedVolumes.size > 0) {
      yaml += 'volumes:\n'
      for (const vol of namedVolumes) {
        yaml += `  ${vol}:\n`
      }
    }

    await fs.writeFile(path.join(projectPath, 'docker-compose.yml'), yaml, 'utf-8')
  }

  private async wireModules(
    projectPath: string,
    structure: string,
    ctx: PluginContextImpl,
  ): Promise<void> {
    const modules = ctx.getModules()
    const providers = ctx.getProviders()
    if (modules.length === 0 && providers.length === 0) return

    const appModulePath =
      structure === 'monorepo'
        ? path.join(projectPath, 'apps/api/src/app.module.ts')
        : path.join(projectPath, 'src/app.module.ts')

    if (!(await fs.pathExists(appModulePath))) return

    const source = await fs.readFile(appModulePath, 'utf-8')
    const wirer = new ModuleWirer(source)

    for (const mod of modules) {
      wirer.addModule(mod.moduleName, mod.importPath)
    }

    for (const prov of providers) {
      wirer.addProvider(prov.moduleName, prov.importPath)
    }

    await fs.writeFile(appModulePath, wirer.toString(), 'utf-8')
  }
}
