export type ProjectStructure = 'monolith' | 'monorepo'

export type PackageManager = 'npm' | 'yarn' | 'pnpm' | 'bun'

export type PluginCategory =
  | 'database'
  | 'orm'
  | 'auth'
  | 'cache'
  | 'realtime'
  | 'docs'
  | 'infra'
  | 'logger'
  | 'queue'
  | 'mailer'
  | 'upload'

export interface UserSelections {
  projectName: string
  structure: ProjectStructure
  packageManager: PackageManager
  database: string | null
  orm: string | null
  auth: string | null
  cache: string | null
  realtime: string | null
  docs: string | null
  docker: boolean
  logger: string | null
  queue: string | null
  mailer: string | null
  upload: string | null
}

export interface PromptQuestion {
  type: 'list' | 'confirm' | 'input'
  name: string
  message: string
  choices?: { name: string; value: string }[]
  default?: string | boolean
}

export interface DockerServiceConfig {
  image: string
  ports?: string[]
  environment?: Record<string, string>
  volumes?: string[]
  restart?: string
}

export interface ModuleRegistration {
  moduleName: string
  importPath: string
  isGlobal?: boolean
}

export interface PluginContext {
  projectName: string
  projectPath: string
  structure: ProjectStructure
  selections: UserSelections
  pluginsDir: string

  copyTemplates(source: string, dest?: string): void
  renderTemplate(source: string, dest: string, data: Record<string, unknown>): void

  addDependencies(deps: Record<string, string>): void
  addDevDependencies(deps: Record<string, string>): void
  addScripts(scripts: Record<string, string>): void

  registerModule(moduleName: string, importPath: string): void
  registerProvider(providerName: string, importPath: string): void

  addEnvVars(vars: Record<string, string>): void
  addDockerService(name: string, config: DockerServiceConfig): void
}

export interface PluginDefinition {
  name: string
  category: PluginCategory
  displayName: string
  description: string
  conflicts?: string[]
  requires?: string[]
  optionalDeps?: string[]
  isCompatible?: (selections: UserSelections) => boolean
  prompts?: (selections: UserSelections) => PromptQuestion[]
  install: (ctx: PluginContext) => Promise<void>
}

export function definePlugin(def: PluginDefinition): PluginDefinition {
  return def
}
