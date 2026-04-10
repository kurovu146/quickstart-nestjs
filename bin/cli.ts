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
    const spinner = ora('Generating project...').start()
    const skeletonsDir = path.resolve(__dirname, '../src/skeletons')
    const outputDir = process.cwd()

    try {
      const engine = new GeneratorEngine(registry)
      const projectPath = await engine.generate({
        outputDir,
        selections,
        skeletonsDir,
        selectedPlugins,
      })

      spinner.succeed('Project generated!')
      console.log('')
      console.log(chalk.bold('Next steps:'))
      console.log(`  cd ${selections.projectName}`)
      console.log(`  ${selections.packageManager} run start:dev`)
      console.log('')
    } catch (err) {
      spinner.fail('Generation failed')
      console.error(err)
      process.exit(1)
    }
  })

program.parse()
