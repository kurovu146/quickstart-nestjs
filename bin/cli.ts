import { Command } from 'commander'
import chalk from 'chalk'
import ora from 'ora'
import path from 'path'
import { fileURLToPath } from 'url'
import { runPrompts } from '../src/cli/prompts.js'
import { showSummary } from '../src/cli/summary.js'
import { GeneratorEngine } from '../src/core/engine.js'
import { PluginRegistry } from '../src/core/plugin-registry.js'
import { loadAllPlugins } from '../src/plugins/index.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const program = new Command()

program
  .name('quickstart-nestjs')
  .description('Scaffold production-ready NestJS projects')
  .version('0.1.0')
  .argument('[project-name]', 'Name of the project')
  .action(async (projectName?: string) => {
    console.log('')
    console.log(chalk.bold.cyan('⚡ quickstart-nestjs'))
    console.log(chalk.gray('Scaffold production-ready NestJS projects'))
    console.log('')

    // Load plugins
    const registry = new PluginRegistry()
    loadAllPlugins(registry)

    // Run prompts
    let selections = await runPrompts(registry, projectName)

    // Show summary and confirm
    let confirmed = await showSummary(selections)
    while (!confirmed) {
      selections = await runPrompts(registry, projectName)
      confirmed = await showSummary(selections)
    }

    // Collect selected plugin names
    const selectedPlugins: string[] = []
    const pluginFields: (keyof typeof selections)[] = [
      'database', 'orm', 'auth', 'cache', 'realtime', 'docs', 'logger', 'queue', 'mailer', 'upload',
    ]
    for (const field of pluginFields) {
      const val = selections[field]
      if (typeof val === 'string') selectedPlugins.push(val)
    }
    if (selections.docker) selectedPlugins.push('docker')

    // Generate
    const spinner = ora('Scaffolding project...').start()
    const skeletonsDir = path.resolve(__dirname, '../src/skeletons')
    const outputDir = process.cwd()

    try {
      const engine = new GeneratorEngine(registry)

      // Step 1: Generate files
      const projectPath = await engine.generate({
        outputDir,
        selections,
        skeletonsDir,
        selectedPlugins,
        skipInstall: true,
        skipGit: true,
      })
      spinner.succeed('Project scaffolded!')

      // Step 2: Install dependencies
      const installSpinner = ora(`Installing dependencies with ${selections.packageManager}...`).start()
      try {
        engine.installDependencies(projectPath, selections.packageManager)
        installSpinner.succeed('Dependencies installed!')
      } catch {
        installSpinner.warn('Failed to install dependencies. Run install manually.')
      }

      // Step 2b: Run post-install steps (e.g. prisma generate)
      if (selections.orm === 'prisma') {
        const postSpinner = ora('Generating Prisma client...').start()
        try {
          engine.runPostInstallSteps(projectPath, selections, selections.packageManager)
          postSpinner.succeed('Prisma client generated!')
        } catch {
          postSpinner.warn('Failed to generate Prisma client. Run `npx prisma generate` manually.')
        }
      }

      // Step 3: Init git
      const gitSpinner = ora('Initializing git repository...').start()
      try {
        engine.initGit(projectPath)
        gitSpinner.succeed('Git repository initialized!')
      } catch {
        gitSpinner.warn('Failed to initialize git. Run git init manually.')
      }

      console.log('')
      console.log(chalk.bold('Done! Next steps:'))
      const pm = selections.packageManager
      const run = pm === 'npm' ? 'npm run' : pm
      const exec = pm === 'npm' ? 'npx' : pm === 'yarn' ? 'yarn' : pm === 'pnpm' ? 'pnpm exec' : 'bunx'

      console.log(`  cd ${selections.projectName}`)

      if (selections.docker) {
        console.log(chalk.gray('  # Start databases (or use your own and update .env)'))
        console.log(`  ${run} db:up`)
      } else if (selections.database) {
        console.log(chalk.gray('  # Make sure your database is running and .env is configured'))
      }

      if (selections.orm === 'prisma') {
        console.log(chalk.gray('  # Create tables from schema'))
        console.log(`  ${exec} prisma migrate dev --name init`)
      } else if (selections.orm === 'typeorm' || selections.orm === 'sequelize') {
        console.log(chalk.gray('  # Run migrations if you have any'))
      }

      console.log(chalk.gray('  # Start the app'))
      console.log(`  ${run} start:dev`)
      console.log('')
    } catch (err) {
      spinner.fail('Generation failed')
      console.error(err)
      process.exit(1)
    }
  })

program.parse()
