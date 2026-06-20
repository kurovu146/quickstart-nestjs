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
    const header = new RegExp(`${arrayName}:\\s*\\[`)
    const headerMatch = header.exec(source)
    if (!headerMatch) return source

    // Find the matching close bracket by tracking depth, so nested arrays/objects
    // (e.g. `imports: [ConfigModule.forRoot({ load: [appConfig] })]`) don't trip
    // us up the way a naive `[^\]]*` regex would.
    const open = headerMatch.index + headerMatch[0].length
    let depth = 1
    let close = open
    for (; close < source.length; close++) {
      const ch = source[close]
      if (ch === '[') depth++
      else if (ch === ']') {
        depth--
        if (depth === 0) break
      }
    }
    if (depth !== 0) return source

    const existingContent = source.slice(open, close).trim()
    const separator =
      existingContent.length === 0 ? '' : existingContent.endsWith(',') ? '\n    ' : ',\n    '

    return source.slice(0, close) + separator + value + source.slice(close)
  }
}
