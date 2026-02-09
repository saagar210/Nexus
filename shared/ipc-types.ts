export type IpcResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

export interface HttpRequest {
  method: string
  url: string
  headers: Record<string, string>
  body?: string
  timeout?: number
}

export interface HttpResponse {
  statusCode: number
  statusText: string
  headers: Record<string, string>
  body: string
  size: number
  timing: RequestTiming
  isTruncated: boolean
}

export interface RequestTiming {
  startTime: number
  dnsTime: number
  connectTime: number
  tlsTime: number
  firstByteTime: number
  totalTime: number
}

export interface SavedRequest {
  id: string
  collectionId: string | null
  workspaceId: string
  name: string
  method: string
  url: string
  headers: Array<{ key: string; value: string; enabled: boolean }>
  queryParams: Array<{ key: string; value: string; enabled: boolean }>
  bodyType: 'none' | 'json' | 'text' | 'form-urlencoded' | null
  bodyContent: string | null
  authType: 'none' | 'basic' | 'bearer' | null
  authConfig: Record<string, string> | null
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface Workspace {
  id: string
  name: string
  description: string | null
  baseUrl: string | null
  createdAt: string
  updatedAt: string
}

export interface HistoryEntry {
  id: string
  requestId: string | null
  workspaceId: string
  method: string
  url: string
  requestHeaders: string | null
  requestBody: string | null
  statusCode: number | null
  responseHeaders: string | null
  responseBody: string | null
  responseSizeBytes: number | null
  responseTimeMs: number | null
  errorMessage: string | null
  executedAt: string
}
