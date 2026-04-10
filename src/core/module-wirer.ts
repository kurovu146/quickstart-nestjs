// src/core/module-wirer.ts

interface Registration {
  name: string
  importPath: string
}

export class ModuleWirer {
  private source: string
  private modules: Registration[] = []
  private providers: Registration[] = []

  constructor(source: string) {
    this.source = source
  }

  addModule(moduleName: string, importPath: string): void {
    this.modules.push({ name: moduleName, importPath })
  }

  addProvider(providerName: string, importPath: string): void {
    this.providers.push({ name: providerName, importPath })
  }

  toString(): string {
    let result = this.source

    const allRegistrations = [...this.modules, ...this.providers]
    const importStatements = allRegistrations
      .map((r) => `import { ${r.name} } from '${r.importPath}';`)
      .join('\n')

    const moduleDecoratorIndex = result.indexOf('@Module(')
    if (moduleDecoratorIndex !== -1) {
      result = result.slice(0, moduleDecoratorIndex) + importStatements + '\n\n' + result.slice(moduleDecoratorIndex)
    }

    for (const mod of this.modules) {
      result = this.injectIntoArray(result, 'imports', mod.name)
    }

    for (const prov of this.providers) {
      result = this.injectIntoArray(result, 'providers', prov.name)
    }

    return result
  }

  private injectIntoArray(source: string, arrayName: string, value: string): string {
    const regex = new RegExp(`(${arrayName}:\\s*\\[)([^\\]]*)`, 's')
    const match = source.match(regex)
    if (!match) return source

    const existingContent = match[2].trim()
    const separator =
      existingContent.length === 0 ? '' : existingContent.endsWith(',') ? '\n    ' : ',\n    '

    return source.replace(regex, `$1${match[2]}${separator}${value}`)
  }
}
