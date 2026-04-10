import chalk from 'chalk'
import inquirer from 'inquirer'
import type { UserSelections } from '../core/types.js'

export async function showSummary(selections: UserSelections): Promise<boolean> {
  console.log('')
  console.log(chalk.bold('Project Configuration:'))
  console.log(chalk.gray('─'.repeat(40)))
  console.log(`  ${chalk.cyan('Name:')}        ${selections.projectName}`)
  console.log(`  ${chalk.cyan('Structure:')}   ${selections.structure}`)
  console.log(`  ${chalk.cyan('Pkg Manager:')} ${selections.packageManager}`)
  console.log('')

  const features: [string, string | null | boolean][] = [
    ['Database', selections.database],
    ['ORM', selections.orm],
    ['Auth', selections.auth],
    ['Cache', selections.cache],
    ['Realtime', selections.realtime],
    ['API Docs', selections.docs],
    ['Docker', selections.docker],
    ['Logger', selections.logger],
    ['Queue', selections.queue],
    ['Mailer', selections.mailer],
    ['Upload', selections.upload],
  ]

  console.log(chalk.bold('Selected features:'))
  for (const [label, value] of features) {
    if (value === null || value === false) continue
    const display = typeof value === 'boolean' ? 'Yes' : value
    console.log(`  ${chalk.green('✓')} ${label}: ${chalk.white(display)}`)
  }
  console.log(chalk.gray('─'.repeat(40)))
  console.log('')

  const { confirmed } = await inquirer.prompt([
    { type: 'confirm', name: 'confirmed', message: 'Proceed with this configuration?', default: true },
  ])

  return confirmed
}
