// src/core/__tests__/module-wirer.test.ts
import { describe, it, expect } from 'vitest'
import { ModuleWirer } from '../module-wirer.js'

describe('ModuleWirer', () => {
  it('should inject a single module import and registration', () => {
    const source = `import { Module } from '@nestjs/common';

@Module({
  imports: [],
  controllers: [],
  providers: [],
})
export class AppModule {}
`
    const wirer = new ModuleWirer(source)
    wirer.addModule('PrismaModule', './prisma/prisma.module')

    const result = wirer.toString()

    expect(result).toContain("import { PrismaModule } from './prisma/prisma.module'")
    expect(result).toMatch(/imports:\s*\[[\s\S]*PrismaModule/)
  })

  it('should inject multiple modules preserving order', () => {
    const source = `import { Module } from '@nestjs/common';

@Module({
  imports: [],
  controllers: [],
  providers: [],
})
export class AppModule {}
`
    const wirer = new ModuleWirer(source)
    wirer.addModule('PrismaModule', './prisma/prisma.module')
    wirer.addModule('AuthModule', './auth/auth.module')

    const result = wirer.toString()

    expect(result).toContain("import { PrismaModule } from './prisma/prisma.module'")
    expect(result).toContain("import { AuthModule } from './auth/auth.module'")
    expect(result).toMatch(/imports:\s*\[[\s\S]*PrismaModule[\s\S]*AuthModule/)
  })

  it('should inject a provider', () => {
    const source = `import { Module } from '@nestjs/common';

@Module({
  imports: [],
  controllers: [],
  providers: [],
})
export class AppModule {}
`
    const wirer = new ModuleWirer(source)
    wirer.addProvider('AppService', './app.service')

    const result = wirer.toString()

    expect(result).toContain("import { AppService } from './app.service'")
    expect(result).toMatch(/providers:\s*\[[\s\S]*AppService/)
  })

  it('should work with existing imports in arrays', () => {
    const source = `import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule.forRoot()],
  controllers: [],
  providers: [],
})
export class AppModule {}
`
    const wirer = new ModuleWirer(source)
    wirer.addModule('PrismaModule', './prisma/prisma.module')

    const result = wirer.toString()

    expect(result).toContain("import { PrismaModule } from './prisma/prisma.module'")
    expect(result).toMatch(/imports:\s*\[[\s\S]*ConfigModule\.forRoot\(\)[\s\S]*PrismaModule/)
  })
})
