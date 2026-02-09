import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useHistoryStore } from '@/stores/history'

const mockInvoke = vi.fn()
vi.stubGlobal('window', {
  api: { invoke: mockInvoke, on: vi.fn(() => vi.fn()) },
})

const sampleEntries = [
  {
    id: 'h-1', requestId: null, workspaceId: 'ws-1',
    method: 'GET', url: 'https://api.example.com/users',
    requestHeaders: null, requestBody: null,
    statusCode: 200, responseHeaders: null, responseBody: null,
    responseSizeBytes: 500, responseTimeMs: 120,
    errorMessage: null, executedAt: '2024-01-01T12:00:00Z',
  },
  {
    id: 'h-2', requestId: null, workspaceId: 'ws-1',
    method: 'POST', url: 'https://api.example.com/users',
    requestHeaders: null, requestBody: '{"name":"test"}',
    statusCode: 201, responseHeaders: null, responseBody: null,
    responseSizeBytes: 100, responseTimeMs: 250,
    errorMessage: null, executedAt: '2024-01-01T12:01:00Z',
  },
  {
    id: 'h-3', requestId: null, workspaceId: 'ws-1',
    method: 'GET', url: 'https://api.example.com/posts',
    requestHeaders: null, requestBody: null,
    statusCode: 404, responseHeaders: null, responseBody: null,
    responseSizeBytes: 50, responseTimeMs: 80,
    errorMessage: null, executedAt: '2024-01-01T12:02:00Z',
  },
]

describe('History Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    mockInvoke.mockReset()
  })

  it('initializes with empty state', () => {
    const store = useHistoryStore()
    expect(store.entries).toEqual([])
    expect(store.filteredEntries).toEqual([])
    expect(store.filters.method).toBeNull()
    expect(store.filters.statusCode).toBe('')
    expect(store.filters.urlPattern).toBe('')
  })

  it('fetches history entries', async () => {
    mockInvoke.mockResolvedValue({ success: true, data: sampleEntries })

    const store = useHistoryStore()
    await store.fetchHistory('ws-1')

    expect(store.entries).toHaveLength(3)
    expect(mockInvoke).toHaveBeenCalledWith('db:history:list', { workspaceId: 'ws-1', limit: 100 })
  })

  it('filters by method', () => {
    const store = useHistoryStore()
    store.entries = [...sampleEntries]
    store.filters.method = 'GET'

    expect(store.filteredEntries).toHaveLength(2)
    expect(store.filteredEntries.every(e => e.method === 'GET')).toBe(true)
  })

  it('filters by status code', () => {
    const store = useHistoryStore()
    store.entries = [...sampleEntries]
    store.filters.statusCode = '404'

    expect(store.filteredEntries).toHaveLength(1)
    expect(store.filteredEntries[0].url).toContain('posts')
  })

  it('filters by URL pattern', () => {
    const store = useHistoryStore()
    store.entries = [...sampleEntries]
    store.filters.urlPattern = 'users'

    expect(store.filteredEntries).toHaveLength(2)
  })

  it('combines multiple filters', () => {
    const store = useHistoryStore()
    store.entries = [...sampleEntries]
    store.filters.method = 'GET'
    store.filters.urlPattern = 'users'

    expect(store.filteredEntries).toHaveLength(1)
    expect(store.filteredEntries[0].id).toBe('h-1')
  })

  it('clears filters', () => {
    const store = useHistoryStore()
    store.filters.method = 'POST'
    store.filters.statusCode = '200'
    store.filters.urlPattern = 'test'

    store.clearFilters()

    expect(store.filters.method).toBeNull()
    expect(store.filters.statusCode).toBe('')
    expect(store.filters.urlPattern).toBe('')
  })

  it('handles invalid status code filter gracefully', () => {
    const store = useHistoryStore()
    store.entries = [...sampleEntries]
    store.filters.statusCode = 'abc'

    expect(store.filteredEntries).toHaveLength(3)
  })

  it('case-insensitive URL filtering', () => {
    const store = useHistoryStore()
    store.entries = [...sampleEntries]
    store.filters.urlPattern = 'USERS'

    expect(store.filteredEntries).toHaveLength(2)
  })
})
