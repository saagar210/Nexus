import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useDiscoveryStore } from '@/stores/discovery'
import type { DiscoveredEndpoint } from '@shared/ipc-types'

const mockInvoke = vi.fn()
const mockOn = vi.fn(() => vi.fn())
vi.stubGlobal('window', {
  api: { invoke: mockInvoke, on: mockOn },
})

const sampleEndpoints: DiscoveredEndpoint[] = [
  {
    id: 'ep-1', workspaceId: 'ws-1', path: '/pets', method: 'GET',
    summary: 'List all pets', description: null, parameters: null,
    requestSchema: null, responseSchema: null, tags: ['pets'],
    authRequired: false, deprecated: false, source: 'spec', discoveredAt: '',
  },
  {
    id: 'ep-2', workspaceId: 'ws-1', path: '/pets', method: 'POST',
    summary: 'Create a pet', description: null, parameters: null,
    requestSchema: null, responseSchema: null, tags: ['pets'],
    authRequired: true, deprecated: false, source: 'spec', discoveredAt: '',
  },
  {
    id: 'ep-3', workspaceId: 'ws-1', path: '/store/inventory', method: 'GET',
    summary: 'Returns pet inventories', description: null, parameters: null,
    requestSchema: null, responseSchema: null, tags: ['store'],
    authRequired: false, deprecated: false, source: 'spec', discoveredAt: '',
  },
]

describe('Discovery Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    mockInvoke.mockReset()
    mockOn.mockClear()
  })

  it('initializes with empty state', () => {
    const store = useDiscoveryStore()
    expect(store.endpoints).toEqual([])
    expect(store.isDiscovering).toBe(false)
    expect(store.progress).toBeNull()
  })

  it('groups endpoints by tag', () => {
    const store = useDiscoveryStore()
    store.endpoints = [...sampleEndpoints]

    expect(store.groupedEndpoints.size).toBe(2)
    expect(store.groupedEndpoints.get('pets')).toHaveLength(2)
    expect(store.groupedEndpoints.get('store')).toHaveLength(1)
  })

  it('fetches endpoints from DB', async () => {
    mockInvoke.mockResolvedValue({ success: true, data: sampleEndpoints })

    const store = useDiscoveryStore()
    await store.fetchEndpoints('ws-1')

    expect(store.endpoints).toHaveLength(3)
    expect(mockInvoke).toHaveBeenCalledWith('db:discovery:list', { workspaceId: 'ws-1' })
  })

  it('clears endpoints', async () => {
    mockInvoke.mockResolvedValue({ success: true, data: undefined })

    const store = useDiscoveryStore()
    store.endpoints = [...sampleEndpoints]

    await store.clearEndpoints('ws-1')

    expect(store.endpoints).toHaveLength(0)
    expect(mockInvoke).toHaveBeenCalledWith('db:discovery:clear', { workspaceId: 'ws-1' })
  })

  it('starts discovery and stores results', async () => {
    mockInvoke.mockImplementation((channel: string) => {
      if (channel === 'discovery:start') {
        return {
          success: true,
          data: {
            endpoints: sampleEndpoints,
            specUrl: 'https://example.com/openapi.json',
            specVersion: '3.0.3',
            title: 'Petstore',
          },
        }
      }
      return { success: true, data: null }
    })

    const store = useDiscoveryStore()
    await store.startDiscovery('ws-1', 'https://example.com')

    expect(store.endpoints).toHaveLength(3)
    expect(store.isDiscovering).toBe(false)
  })

  it('cancels discovery', async () => {
    mockInvoke.mockResolvedValue({ success: true, data: undefined })

    const store = useDiscoveryStore()
    store.isDiscovering = true

    await store.cancelDiscovery()

    expect(store.isDiscovering).toBe(false)
    expect(mockInvoke).toHaveBeenCalledWith('discovery:cancel')
  })

  it('sets up progress listener', () => {
    const store = useDiscoveryStore()
    store.setupProgressListener()

    expect(mockOn).toHaveBeenCalledWith('discovery:progress', expect.any(Function))
  })

  it('groups endpoints with no tags under default', () => {
    const store = useDiscoveryStore()
    store.endpoints = [
      { ...sampleEndpoints[0], tags: [] },
    ]

    expect(store.groupedEndpoints.get('default')).toHaveLength(1)
  })
})
