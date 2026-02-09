import { getDatabase } from '../connection'
import { nanoid } from 'nanoid'
import type { Workspace } from '@shared/ipc-types'

interface WorkspaceRow {
  id: string
  name: string
  description: string | null
  base_url: string | null
  created_at: string
  updated_at: string
}

function rowToWorkspace(row: WorkspaceRow): Workspace {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    baseUrl: row.base_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function listWorkspaces(): Workspace[] {
  const db = getDatabase()
  const rows = db.prepare('SELECT * FROM workspaces ORDER BY created_at').all() as WorkspaceRow[]
  return rows.map(rowToWorkspace)
}

export function getWorkspace(id: string): Workspace | null {
  const db = getDatabase()
  const row = db.prepare('SELECT * FROM workspaces WHERE id = ?').get(id) as WorkspaceRow | undefined
  return row ? rowToWorkspace(row) : null
}

export function getOrCreateDefaultWorkspace(): Workspace {
  const db = getDatabase()
  const existing = db.prepare("SELECT * FROM workspaces WHERE name = 'Default Workspace'").get() as WorkspaceRow | undefined

  if (existing) {
    return rowToWorkspace(existing)
  }

  const id = nanoid()
  db.prepare(
    'INSERT INTO workspaces (id, name, description) VALUES (?, ?, ?)'
  ).run(id, 'Default Workspace', 'Your default workspace')

  const created = db.prepare('SELECT * FROM workspaces WHERE id = ?').get(id) as WorkspaceRow
  return rowToWorkspace(created)
}
