import { describe, it, expect } from 'vitest'
import { getMigrations } from '../../../electron/main/database/migrations'

describe('Migrations', () => {
  it('returns at least one migration', () => {
    const migrations = getMigrations()
    expect(migrations.length).toBeGreaterThanOrEqual(1)
  })

  it('first migration is 001_initial', () => {
    const migrations = getMigrations()
    expect(migrations[0].name).toBe('001_initial')
  })

  it('all migrations have name and sql', () => {
    const migrations = getMigrations()
    for (const m of migrations) {
      expect(m.name).toBeTruthy()
      expect(m.sql).toBeTruthy()
    }
  })

  it('migration names are unique', () => {
    const migrations = getMigrations()
    const names = migrations.map(m => m.name)
    expect(new Set(names).size).toBe(names.length)
  })

  it('initial migration SQL creates expected tables', () => {
    const migrations = getMigrations()
    const initialSql = migrations[0].sql
    expect(initialSql).toContain('CREATE TABLE workspaces')
    expect(initialSql).toContain('CREATE TABLE collections')
    expect(initialSql).toContain('CREATE TABLE requests')
    expect(initialSql).toContain('CREATE TABLE request_history')
    expect(initialSql).toContain('CREATE TABLE environments')
    expect(initialSql).toContain('CREATE TABLE env_variables')
  })

  it('has migration 002 for discovered endpoints', () => {
    const migrations = getMigrations()
    expect(migrations.length).toBeGreaterThanOrEqual(2)
    expect(migrations[1].name).toBe('002_discovered_endpoints')
    expect(migrations[1].sql).toContain('CREATE TABLE discovered_endpoints')
  })

  it('002 migration creates indexes', () => {
    const migrations = getMigrations()
    const sql = migrations[1].sql
    expect(sql).toContain('CREATE INDEX idx_discovered_workspace')
    expect(sql).toContain('CREATE INDEX idx_discovered_method')
  })
})
