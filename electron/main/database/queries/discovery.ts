import { getDatabase } from '../connection'
import { nanoid } from 'nanoid'
import type { DiscoveredEndpoint } from '@shared/ipc-types'

interface DiscoveredEndpointRow {
  id: string
  workspace_id: string
  path: string
  method: string
  summary: string | null
  description: string | null
  parameters: string | null
  request_schema: string | null
  response_schema: string | null
  tags: string
  auth_required: number
  deprecated: number
  source: string
  discovered_at: string
}

function rowToEndpoint(row: DiscoveredEndpointRow): DiscoveredEndpoint {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    path: row.path,
    method: row.method,
    summary: row.summary,
    description: row.description,
    parameters: row.parameters,
    requestSchema: row.request_schema,
    responseSchema: row.response_schema,
    tags: JSON.parse(row.tags || '[]'),
    authRequired: Boolean(row.auth_required),
    deprecated: Boolean(row.deprecated),
    source: row.source,
    discoveredAt: row.discovered_at,
  }
}

export function saveDiscoveredEndpoints(workspaceId: string, endpoints: Array<Omit<DiscoveredEndpoint, 'id' | 'workspaceId' | 'discoveredAt'>>): DiscoveredEndpoint[] {
  const db = getDatabase()

  const stmt = db.prepare(`
    INSERT INTO discovered_endpoints (id, workspace_id, path, method, summary, description,
      parameters, request_schema, response_schema, tags, auth_required, deprecated, source)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const ids: string[] = []

  const transaction = db.transaction(() => {
    for (const ep of endpoints) {
      const id = nanoid()
      ids.push(id)
      stmt.run(
        id, workspaceId, ep.path, ep.method, ep.summary, ep.description,
        ep.parameters, ep.requestSchema, ep.responseSchema,
        JSON.stringify(ep.tags), ep.authRequired ? 1 : 0, ep.deprecated ? 1 : 0, ep.source
      )
    }
  })

  transaction()

  return ids.map(id => {
    const row = db.prepare('SELECT * FROM discovered_endpoints WHERE id = ?').get(id) as DiscoveredEndpointRow
    return rowToEndpoint(row)
  })
}

export function listDiscoveredEndpoints(workspaceId: string): DiscoveredEndpoint[] {
  const db = getDatabase()
  const rows = db.prepare(
    'SELECT * FROM discovered_endpoints WHERE workspace_id = ? ORDER BY path, method'
  ).all(workspaceId) as DiscoveredEndpointRow[]
  return rows.map(rowToEndpoint)
}

export function clearDiscoveredEndpoints(workspaceId: string): void {
  const db = getDatabase()
  db.prepare('DELETE FROM discovered_endpoints WHERE workspace_id = ?').run(workspaceId)
}
