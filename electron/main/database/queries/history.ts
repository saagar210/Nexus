import { getDatabase } from '../connection'
import { nanoid } from 'nanoid'
import type { HistoryEntry } from '@shared/ipc-types'

interface HistoryRow {
  id: string
  request_id: string | null
  workspace_id: string
  method: string
  url: string
  request_headers: string | null
  request_body: string | null
  status_code: number | null
  response_headers: string | null
  response_body: string | null
  response_size_bytes: number | null
  response_time_ms: number | null
  error_message: string | null
  executed_at: string
}

function rowToHistoryEntry(row: HistoryRow): HistoryEntry {
  return {
    id: row.id,
    requestId: row.request_id,
    workspaceId: row.workspace_id,
    method: row.method,
    url: row.url,
    requestHeaders: row.request_headers,
    requestBody: row.request_body,
    statusCode: row.status_code,
    responseHeaders: row.response_headers,
    responseBody: row.response_body,
    responseSizeBytes: row.response_size_bytes,
    responseTimeMs: row.response_time_ms,
    errorMessage: row.error_message,
    executedAt: row.executed_at,
  }
}

export function saveHistoryEntry(entry: Omit<HistoryEntry, 'id' | 'executedAt'>): HistoryEntry {
  const db = getDatabase()
  const id = nanoid()

  db.prepare(`
    INSERT INTO request_history (id, request_id, workspace_id, method, url,
      request_headers, request_body, status_code, response_headers, response_body,
      response_size_bytes, response_time_ms, error_message)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, entry.requestId, entry.workspaceId, entry.method, entry.url,
    entry.requestHeaders, entry.requestBody, entry.statusCode,
    entry.responseHeaders, entry.responseBody,
    entry.responseSizeBytes, entry.responseTimeMs, entry.errorMessage
  )

  const saved = db.prepare('SELECT * FROM request_history WHERE id = ?').get(id) as HistoryRow
  return rowToHistoryEntry(saved)
}

export function listHistory(workspaceId: string, limit: number = 50): HistoryEntry[] {
  const db = getDatabase()
  const rows = db.prepare(
    'SELECT * FROM request_history WHERE workspace_id = ? ORDER BY executed_at DESC LIMIT ?'
  ).all(workspaceId, limit) as HistoryRow[]
  return rows.map(rowToHistoryEntry)
}
