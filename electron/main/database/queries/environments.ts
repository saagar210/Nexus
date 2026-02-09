import { getDatabase } from '../connection'
import { nanoid } from 'nanoid'
import type { Environment, EnvVariable } from '@shared/ipc-types'

interface EnvironmentRow {
  id: string
  workspace_id: string
  name: string
  is_active: number
  created_at: string
}

interface EnvVariableRow {
  id: string
  environment_id: string
  key: string
  value: string
  is_secret: number
}

function rowToEnvironment(row: EnvironmentRow): Environment {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    name: row.name,
    isActive: Boolean(row.is_active),
    createdAt: row.created_at,
  }
}

function rowToVariable(row: EnvVariableRow): EnvVariable {
  return {
    id: row.id,
    environmentId: row.environment_id,
    key: row.key,
    value: row.value,
    isSecret: Boolean(row.is_secret),
  }
}

export function listEnvironments(workspaceId: string): Environment[] {
  const db = getDatabase()
  const rows = db.prepare(
    'SELECT * FROM environments WHERE workspace_id = ? ORDER BY name'
  ).all(workspaceId) as EnvironmentRow[]
  return rows.map(rowToEnvironment)
}

export function getEnvironment(id: string): Environment | null {
  const db = getDatabase()
  const row = db.prepare('SELECT * FROM environments WHERE id = ?').get(id) as EnvironmentRow | undefined
  return row ? rowToEnvironment(row) : null
}

export function createEnvironment(args: { workspaceId: string; name: string }): Environment {
  const db = getDatabase()
  const id = nanoid()

  db.prepare('INSERT INTO environments (id, workspace_id, name) VALUES (?, ?, ?)').run(
    id, args.workspaceId, args.name
  )

  const row = db.prepare('SELECT * FROM environments WHERE id = ?').get(id) as EnvironmentRow
  return rowToEnvironment(row)
}

export function updateEnvironment(id: string, updates: { name?: string }): Environment {
  const db = getDatabase()

  if (updates.name !== undefined) {
    db.prepare('UPDATE environments SET name = ? WHERE id = ?').run(updates.name, id)
  }

  const row = db.prepare('SELECT * FROM environments WHERE id = ?').get(id) as EnvironmentRow
  return rowToEnvironment(row)
}

export function deleteEnvironment(id: string): void {
  const db = getDatabase()
  db.prepare('DELETE FROM environments WHERE id = ?').run(id)
}

export function setActiveEnvironment(workspaceId: string, environmentId: string | null): void {
  const db = getDatabase()

  const transaction = db.transaction(() => {
    db.prepare('UPDATE environments SET is_active = 0 WHERE workspace_id = ?').run(workspaceId)
    if (environmentId) {
      db.prepare('UPDATE environments SET is_active = 1 WHERE id = ? AND workspace_id = ?').run(environmentId, workspaceId)
    }
  })

  transaction()
}

export function getActiveEnvironment(workspaceId: string): Environment | null {
  const db = getDatabase()
  const row = db.prepare(
    'SELECT * FROM environments WHERE workspace_id = ? AND is_active = 1'
  ).get(workspaceId) as EnvironmentRow | undefined
  return row ? rowToEnvironment(row) : null
}

export function listVariables(environmentId: string): EnvVariable[] {
  const db = getDatabase()
  const rows = db.prepare(
    'SELECT * FROM env_variables WHERE environment_id = ? ORDER BY key'
  ).all(environmentId) as EnvVariableRow[]
  return rows.map(rowToVariable)
}

export function setVariable(environmentId: string, key: string, value: string, isSecret?: boolean): EnvVariable {
  const db = getDatabase()

  const existing = db.prepare(
    'SELECT id FROM env_variables WHERE environment_id = ? AND key = ?'
  ).get(environmentId, key) as { id: string } | undefined

  if (existing) {
    db.prepare(
      'UPDATE env_variables SET value = ?, is_secret = ? WHERE id = ?'
    ).run(value, isSecret ? 1 : 0, existing.id)

    const row = db.prepare('SELECT * FROM env_variables WHERE id = ?').get(existing.id) as EnvVariableRow
    return rowToVariable(row)
  }

  const id = nanoid()
  db.prepare(
    'INSERT INTO env_variables (id, environment_id, key, value, is_secret) VALUES (?, ?, ?, ?, ?)'
  ).run(id, environmentId, key, value, isSecret ? 1 : 0)

  const row = db.prepare('SELECT * FROM env_variables WHERE id = ?').get(id) as EnvVariableRow
  return rowToVariable(row)
}

export function deleteVariable(id: string): void {
  const db = getDatabase()
  db.prepare('DELETE FROM env_variables WHERE id = ?').run(id)
}

export function getResolvedVariables(workspaceId: string): Record<string, string> {
  const db = getDatabase()
  const activeEnv = db.prepare(
    'SELECT id FROM environments WHERE workspace_id = ? AND is_active = 1'
  ).get(workspaceId) as { id: string } | undefined

  if (!activeEnv) return {}

  const rows = db.prepare(
    'SELECT key, value FROM env_variables WHERE environment_id = ?'
  ).all(activeEnv.id) as Array<{ key: string; value: string }>

  const variables: Record<string, string> = {}
  for (const row of rows) {
    variables[row.key] = row.value
  }
  return variables
}
