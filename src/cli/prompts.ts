import inquirer from 'inquirer'
import type { UserSelections, PluginCategory } from '../core/types.js'
import { PluginRegistry } from '../core/plugin-registry.js'

export async function runPrompts(
  registry: PluginRegistry,
  projectNameArg?: string,
): Promise<UserSelections> {
  const { projectName } = projectNameArg
    ? { projectName: projectNameArg }
    : await inquirer.prompt([
        {
          type: 'input',
          name: 'projectName',
          message: 'Project name:',
          default: 'my-nest-app',
          validate: (input: string) =>
            /^[a-z0-9-_]+$/.test(input) || 'Use lowercase, numbers, hyphens, underscores only',
        },
      ])

  const { structure } = await inquirer.prompt([
    {
      type: 'list',
      name: 'structure',
      message: 'Project structure:',
      choices: [
        { name: 'Monolith — single application', value: 'monolith' },
        { name: 'Monorepo — multiple apps + shared libs', value: 'monorepo' },
      ],
    },
  ])

  const { packageManager } = await inquirer.prompt([
    {
      type: 'list',
      name: 'packageManager',
      message: 'Package manager:',
      choices: [
        { name: 'npm', value: 'npm' },
        { name: 'yarn', value: 'yarn' },
        { name: 'pnpm', value: 'pnpm' },
        { name: 'bun', value: 'bun' },
      ],
    },
  ])

  const selections: UserSelections = {
    projectName,
    structure,
    packageManager,
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

  // Database
  selections.database = await promptCategory(registry, 'database', selections, 'Database:')

  // ORM (filtered by database)
  if (selections.database) {
    selections.orm = await promptCategory(registry, 'orm', selections, 'ORM:')
  }

  // Auth (requires ORM)
  if (selections.orm) {
    selections.auth = await promptCategory(registry, 'auth', selections, 'Authentication:')
  }

  // Cache
  selections.cache = await promptCategory(registry, 'cache', selections, 'Caching:')

  // Realtime
  selections.realtime = await promptCategory(registry, 'realtime', selections, 'Realtime:')

  // Docs
  selections.docs = await promptCategory(registry, 'docs', selections, 'API Documentation:')

  // Docker
  const { docker } = await inquirer.prompt([
    { type: 'confirm', name: 'docker', message: 'Docker support?', default: true },
  ])
  selections.docker = docker

  // Logger
  selections.logger = await promptCategory(registry, 'logger', selections, 'Logger:')

  // Queue (filtered by redis)
  selections.queue = await promptCategory(registry, 'queue', selections, 'Queue:')

  // Mailer
  selections.mailer = await promptCategory(registry, 'mailer', selections, 'Mailer:')

  // Upload
  selections.upload = await promptCategory(registry, 'upload', selections, 'File Upload:')

  return selections
}

async function promptCategory(
  registry: PluginRegistry,
  category: PluginCategory,
  selections: UserSelections,
  message: string,
): Promise<string | null> {
  const compatible = registry.getCompatible(category, selections)
  if (compatible.length === 0) return null

  const choices = [
    ...compatible.map((p) => ({ name: `${p.displayName} — ${p.description}`, value: p.name })),
    { name: 'None', value: '__none__' },
  ]

  const { selected } = await inquirer.prompt([
    { type: 'list', name: 'selected', message, choices },
  ])

  return selected === '__none__' ? null : selected
}
