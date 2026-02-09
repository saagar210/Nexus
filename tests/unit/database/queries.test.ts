import { describe, it, expect } from 'vitest'
import { getMigrations } from '../../../electron/main/database/migrations'

// better-sqlite3 is compiled against Electron's Node headers (NODE_MODULE_VERSION 143)
// and cannot load in vitest's system Node (NODE_MODULE_VERSION 127).
// Schema validation tests live in migrations.test.ts.
// Integration tests requiring the actual database run inside the Electron process.

describe('Database Query Logic', () => {
  it('migration SQL is syntactically valid (contains expected statements)', () => {
    const migrations = getMigrations()
    const sql = migrations[0].sql

    // Verify key constraints and relationships
    expect(sql).toContain('REFERENCES workspaces(id) ON DELETE CASCADE')
    expect(sql).toContain('REFERENCES requests(id) ON DELETE SET NULL')
    expect(sql).toContain('REFERENCES collections(id) ON DELETE CASCADE')
    expect(sql).toContain('REFERENCES environments(id) ON DELETE CASCADE')
  })

  it('migration creates indexes', () => {
    const migrations = getMigrations()
    const sql = migrations[0].sql

    expect(sql).toContain('CREATE INDEX idx_requests_workspace')
    expect(sql).toContain('CREATE INDEX idx_requests_collection')
    expect(sql).toContain('CREATE INDEX idx_history_workspace')
    expect(sql).toContain('CREATE INDEX idx_history_executed')
    expect(sql).toContain('CREATE INDEX idx_collections_workspace')
  })

  it('requests table has all expected columns', () => {
    const migrations = getMigrations()
    const sql = migrations[0].sql

    const expectedColumns = [
      'id TEXT PRIMARY KEY',
      'workspace_id TEXT',
      'name TEXT NOT NULL',
      'method TEXT NOT NULL',
      'url TEXT NOT NULL',
      'headers TEXT',
      'query_params TEXT',
      'body_type TEXT',
      'body_content TEXT',
      'auth_type TEXT',
      'auth_config TEXT',
      'sort_order INTEGER',
    ]

    for (const col of expectedColumns) {
      expect(sql).toContain(col)
    }
  })
})
