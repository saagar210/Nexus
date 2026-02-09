import fs from 'node:fs'
import { nanoid } from 'nanoid'
import { getDatabase } from '../database/connection'

interface PostmanCollection {
  info: {
    name: string
    schema: string
  }
  item: PostmanItem[]
  variable?: Array<{ key: string; value: string }>
  auth?: PostmanAuth
}

interface PostmanItem {
  name: string
  item?: PostmanItem[]
  request?: PostmanRequest
}

interface PostmanRequest {
  method: string
  header?: Array<{ key: string; value: string; disabled?: boolean }>
  url: string | PostmanUrl
  body?: PostmanBody
  auth?: PostmanAuth
}

interface PostmanUrl {
  raw: string
  protocol?: string
  host?: string[]
  path?: string[]
  query?: Array<{ key: string; value: string; disabled?: boolean }>
}

interface PostmanBody {
  mode: string
  raw?: string
  urlencoded?: Array<{ key: string; value: string }>
  options?: { raw?: { language?: string } }
}

interface PostmanAuth {
  type: string
  bearer?: Array<{ key: string; value: string }>
  basic?: Array<{ key: string; value: string }>
}

function extractUrl(url: string | PostmanUrl): string {
  if (typeof url === 'string') return url
  return url.raw || ''
}

function extractQueryParams(url: string | PostmanUrl): Array<{ key: string; value: string; enabled: boolean }> {
  if (typeof url === 'string') return []
  return (url.query || []).map(q => ({
    key: q.key,
    value: q.value,
    enabled: !q.disabled,
  }))
}

function extractHeaders(headers?: Array<{ key: string; value: string; disabled?: boolean }>): Array<{ key: string; value: string; enabled: boolean }> {
  return (headers || []).map(h => ({
    key: h.key,
    value: h.value,
    enabled: !h.disabled,
  }))
}

function extractAuth(auth?: PostmanAuth): { authType: string | null; authConfig: Record<string, string> | null } {
  if (!auth) return { authType: null, authConfig: null }

  if (auth.type === 'bearer' && auth.bearer) {
    const tokenEntry = auth.bearer.find(b => b.key === 'token')
    return {
      authType: 'bearer',
      authConfig: { token: tokenEntry?.value || '' },
    }
  }

  if (auth.type === 'basic' && auth.basic) {
    const username = auth.basic.find(b => b.key === 'username')?.value || ''
    const password = auth.basic.find(b => b.key === 'password')?.value || ''
    return {
      authType: 'basic',
      authConfig: { username, password },
    }
  }

  return { authType: null, authConfig: null }
}

function extractBody(body?: PostmanBody): { bodyType: string | null; bodyContent: string | null } {
  if (!body) return { bodyType: null, bodyContent: null }

  if (body.mode === 'raw') {
    const lang = body.options?.raw?.language
    const bodyType = lang === 'json' ? 'json' : 'text'
    return { bodyType, bodyContent: body.raw || null }
  }

  if (body.mode === 'urlencoded') {
    const content = (body.urlencoded || [])
      .map(p => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`)
      .join('&')
    return { bodyType: 'form-urlencoded', bodyContent: content }
  }

  return { bodyType: null, bodyContent: null }
}

function processItems(
  items: PostmanItem[],
  workspaceId: string,
  parentCollectionId: string | null,
  parentAuth?: PostmanAuth,
  db?: ReturnType<typeof getDatabase>
): { collections: number; requests: number } {
  const database = db || getDatabase()
  let collectionsCount = 0
  let requestsCount = 0

  for (let i = 0; i < items.length; i++) {
    const item = items[i]

    if (item.item) {
      // Folder → collection
      const collectionId = nanoid()
      database.prepare(`
        INSERT INTO collections (id, workspace_id, parent_id, name, sort_order)
        VALUES (?, ?, ?, ?, ?)
      `).run(collectionId, workspaceId, parentCollectionId, item.name, i)
      collectionsCount++

      const childResult = processItems(item.item, workspaceId, collectionId, item.request?.auth || parentAuth, database)
      collectionsCount += childResult.collections
      requestsCount += childResult.requests
    } else if (item.request) {
      // Request
      const req = item.request
      const url = extractUrl(req.url)
      const queryParams = extractQueryParams(req.url)
      const headers = extractHeaders(req.header)
      const { authType, authConfig } = extractAuth(req.auth || parentAuth)
      const { bodyType, bodyContent } = extractBody(req.body)

      const requestId = nanoid()
      database.prepare(`
        INSERT INTO requests (id, collection_id, workspace_id, name, method, url,
          headers, query_params, body_type, body_content, auth_type, auth_config, sort_order)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        requestId, parentCollectionId, workspaceId, item.name, req.method || 'GET', url,
        JSON.stringify(headers), JSON.stringify(queryParams),
        bodyType, bodyContent, authType, authConfig ? JSON.stringify(authConfig) : null, i
      )
      requestsCount++
    }
  }

  return { collections: collectionsCount, requests: requestsCount }
}

export function importPostmanCollection(filePath: string, workspaceId: string): { collections: number; requests: number } {
  const content = fs.readFileSync(filePath, 'utf-8')
  const collection: PostmanCollection = JSON.parse(content)

  // Validate it's a Postman collection
  if (!collection.info?.schema?.includes('collection')) {
    throw new Error('Invalid Postman collection file')
  }

  const db = getDatabase()
  let result: { collections: number; requests: number } = { collections: 0, requests: 0 }

  const transaction = db.transaction(() => {
    result = processItems(collection.item || [], workspaceId, null, collection.auth, db)
  })

  transaction()

  return result
}
