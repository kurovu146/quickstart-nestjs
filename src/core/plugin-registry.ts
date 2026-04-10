// src/core/plugin-registry.ts
import type { PluginCategory, PluginDefinition, UserSelections } from './types.js'

export class PluginRegistry {
  private plugins: Map<string, PluginDefinition> = new Map()

  register(plugin: PluginDefinition): void {
    this.plugins.set(plugin.name, plugin)
  }

  get(name: string): PluginDefinition | undefined {
    return this.plugins.get(name)
  }

  getAll(): PluginDefinition[] {
    return Array.from(this.plugins.values())
  }

  getByCategory(category: PluginCategory): PluginDefinition[] {
    return this.getAll().filter((p) => p.category === category)
  }

  getCompatible(category: PluginCategory, selections: UserSelections): PluginDefinition[] {
    return this.getByCategory(category).filter(
      (p) => !p.isCompatible || p.isCompatible(selections),
    )
  }

  findConflicts(selectedNames: string[]): string[] {
    const conflicts: string[] = []
    for (let i = 0; i < selectedNames.length; i++) {
      const pluginA = this.plugins.get(selectedNames[i])
      if (!pluginA?.conflicts) continue
      for (let j = i + 1; j < selectedNames.length; j++) {
        if (pluginA.conflicts.includes(selectedNames[j])) {
          conflicts.push(`${selectedNames[i]} conflicts with ${selectedNames[j]}`)
        }
      }
    }
    return conflicts
  }

  resolveInstallOrder(selectedNames: string[]): string[] {
    const visited = new Set<string>()
    const result: string[] = []
    const selectedSet = new Set(selectedNames)

    const visit = (name: string) => {
      if (visited.has(name)) return
      visited.add(name)
      const plugin = this.plugins.get(name)
      if (!plugin) return
      if (plugin.requires) {
        for (const dep of plugin.requires) {
          if (selectedSet.has(dep)) {
            visit(dep)
          }
        }
      }
      result.push(name)
    }

    const categoryOrder: PluginCategory[] = [
      'database',
      'orm',
      'auth',
      'cache',
      'realtime',
      'queue',
      'mailer',
      'upload',
      'docs',
      'infra',
      'logger',
    ]

    const sorted = [...selectedNames].sort((a, b) => {
      const pluginA = this.plugins.get(a)
      const pluginB = this.plugins.get(b)
      const idxA = pluginA ? categoryOrder.indexOf(pluginA.category) : 999
      const idxB = pluginB ? categoryOrder.indexOf(pluginB.category) : 999
      return idxA - idxB
    })

    for (const name of sorted) {
      visit(name)
    }

    return result
  }
}
