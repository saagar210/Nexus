import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useEnvironmentStore } from '@/stores/environment'

// Mock window.api
const mockInvoke = vi.fn()
vi.stubGlobal('window', {
  api: { invoke: mockInvoke, on: vi.fn(() => vi.fn()) },
})

describe('Environment Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    mockInvoke.mockReset()
  })

  it('initializes with empty state', () => {
    const store = useEnvironmentStore()
    expect(store.environments).toEqual([])
    expect(store.activeEnvironment).toBeNull()
    expect(store.variables).toEqual([])
    expect(store.resolvedVariables).toEqual({})
  })

  it('fetches environments and active env', async () => {
    mockInvoke.mockImplementation((channel: string) => {
      if (channel === 'db:env:list') {
        return { success: true, data: [
          { id: 'env-1', workspaceId: 'ws-1', name: 'Dev', isActive: true, createdAt: '' },
          { id: 'env-2', workspaceId: 'ws-1', name: 'Prod', isActive: false, createdAt: '' },
        ] }
      }
      if (channel === 'db:env:getActive') {
        return { success: true, data: { id: 'env-1', workspaceId: 'ws-1', name: 'Dev', isActive: true, createdAt: '' } }
      }
      if (channel === 'db:env:variables:list') {
        return { success: true, data: [
          { id: 'v-1', environmentId: 'env-1', key: 'base_url', value: 'http://localhost', isSecret: false },
        ] }
      }
      return { success: true, data: null }
    })

    const store = useEnvironmentStore()
    await store.fetchAll('ws-1')

    expect(store.environments).toHaveLength(2)
    expect(store.activeEnvironment?.name).toBe('Dev')
    expect(store.variables).toHaveLength(1)
  })

  it('computes resolvedVariables from variables', async () => {
    const store = useEnvironmentStore()
    store.variables = [
      { id: 'v-1', environmentId: 'env-1', key: 'host', value: 'localhost', isSecret: false },
      { id: 'v-2', environmentId: 'env-1', key: 'token', value: 'abc123', isSecret: true },
    ]

    expect(store.resolvedVariables).toEqual({
      host: 'localhost',
      token: 'abc123',
    })
  })

  it('creates an environment', async () => {
    mockInvoke.mockImplementation((channel: string) => {
      if (channel === 'db:env:create') {
        return { success: true, data: { id: 'env-new', workspaceId: 'ws-1', name: 'Staging', isActive: false, createdAt: '' } }
      }
      if (channel === 'db:env:list') return { success: true, data: [] }
      if (channel === 'db:env:getActive') return { success: true, data: null }
      return { success: true, data: null }
    })

    const store = useEnvironmentStore()
    const result = await store.create('ws-1', 'Staging')

    expect(result).toBeTruthy()
    expect(result?.name).toBe('Staging')
    expect(mockInvoke).toHaveBeenCalledWith('db:env:create', { workspaceId: 'ws-1', name: 'Staging' })
  })

  it('sets active environment', async () => {
    mockInvoke.mockImplementation((channel: string) => {
      if (channel === 'db:env:setActive') return { success: true, data: undefined }
      if (channel === 'db:env:list') return { success: true, data: [] }
      if (channel === 'db:env:getActive') return { success: true, data: null }
      return { success: true, data: null }
    })

    const store = useEnvironmentStore()
    await store.setActive('ws-1', 'env-2')

    expect(mockInvoke).toHaveBeenCalledWith('db:env:setActive', { workspaceId: 'ws-1', environmentId: 'env-2' })
  })

  it('gets resolved variables from DB', async () => {
    mockInvoke.mockImplementation((channel: string) => {
      if (channel === 'db:env:resolvedVariables') {
        return { success: true, data: { base_url: 'http://localhost', api_key: 'secret' } }
      }
      return { success: true, data: null }
    })

    const store = useEnvironmentStore()
    const vars = await store.getResolvedVariablesFromDb('ws-1')

    expect(vars).toEqual({ base_url: 'http://localhost', api_key: 'secret' })
  })
})
