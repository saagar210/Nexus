import { getDatabase } from '../connection'
import { nanoid } from 'nanoid'
import type { SavedRequest } from '@shared/ipc-types'

interface RequestRow {
  id: string
  collection_id: string | null
  workspace_id: string
  name: string
  method: string
  url: string
  headers: string
  query_params: string
  body_type: string | null
  body_content: string | null
  auth_type: string | null
  auth_config: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

function rowToRequest(row: RequestRow): SavedRequest {
  return {
    id: row.id,
    collectionId: row.collection_id,
    workspaceId: row.workspace_id,
    name: row.name,
    method: row.method,
    url: row.url,
    headers: JSON.parse(row.headers),
    queryParams: JSON.parse(row.query_params),
    bodyType: row.body_type as SavedRequest['bodyType'],
    bodyContent: row.body_content,
    authType: row.auth_type as SavedRequest['authType'],
    authConfig: row.auth_config ? JSON.parse(row.auth_config) : null,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function saveRequest(req: Omit<SavedRequest, 'createdAt' | 'updatedAt'>): SavedRequest {
  const db = getDatabase()

  const existing = db.prepare('SELECT id FROM requests WHERE id = ?').get(req.id)

  if (existing) {
    db.prepare(`
      UPDATE requests SET
        collection_id = ?, workspace_id = ?, name = ?, method = ?, url = ?,
        headers = ?, query_params = ?, body_type = ?, body_content = ?,
        auth_type = ?, auth_config = ?, sort_order = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `).run(
      req.collectionId, req.workspaceId, req.name, req.method, req.url,
      JSON.stringify(req.headers), JSON.stringify(req.queryParams),
      req.bodyType, req.bodyContent,
      req.authType, req.authConfig ? JSON.stringify(req.authConfig) : null,
      req.sortOrder, req.id
    )
  } else {
    db.prepare(`
      INSERT INTO requests (id, collection_id, workspace_id, name, method, url,
        headers, query_params, body_type, body_content, auth_type, auth_config, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.id, req.collectionId, req.workspaceId, req.name, req.method, req.url,
      JSON.stringify(req.headers), JSON.stringify(req.queryParams),
      req.bodyType, req.bodyContent,
      req.authType, req.authConfig ? JSON.stringify(req.authConfig) : null,
      req.sortOrder
    )
  }

  const saved = db.prepare('SELECT * FROM requests WHERE id = ?').get(req.id) as RequestRow
  return rowToRequest(saved)
}

export function getRequest(id: string): SavedRequest | null {
  const db = getDatabase()
  const row = db.prepare('SELECT * FROM requests WHERE id = ?').get(id) as RequestRow | undefined
  return row ? rowToRequest(row) : null
}

export function listRequests(workspaceId: string, collectionId?: string | null): SavedRequest[] {
  const db = getDatabase()
  if (collectionId !== undefined) {
    if (collectionId === null) {
      const rows = db.prepare(
        'SELECT * FROM requests WHERE workspace_id = ? AND collection_id IS NULL ORDER BY sort_order, created_at'
      ).all(workspaceId) as RequestRow[]
      return rows.map(rowToRequest)
    }
    const rows = db.prepare(
      'SELECT * FROM requests WHERE workspace_id = ? AND collection_id = ? ORDER BY sort_order, created_at'
    ).all(workspaceId, collectionId) as RequestRow[]
    return rows.map(rowToRequest)
  }
  const rows = db.prepare(
    'SELECT * FROM requests WHERE workspace_id = ? ORDER BY sort_order, created_at'
  ).all(workspaceId) as RequestRow[]
  return rows.map(rowToRequest)
}

export function reorderRequests(items: Array<{ id: string; sortOrder: number; collectionId?: string | null }>): void {
  const db = getDatabase()
  const stmt = db.prepare('UPDATE requests SET sort_order = ?, collection_id = ? WHERE id = ?')

  const transaction = db.transaction(() => {
    for (const item of items) {
      stmt.run(item.sortOrder, item.collectionId ?? null, item.id)
    }
  })

  transaction()
}

export function deleteRequest(id: string): void {
  const db = getDatabase()
  db.prepare('DELETE FROM requests WHERE id = ?').run(id)
}
