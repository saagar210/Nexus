import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import HistoryPanel from '@/components/history/HistoryPanel.vue'
import { useHistoryStore } from '@/stores/history'
import { useRequestStore } from '@/stores/request'
import { useResponseStore } from '@/stores/response'

describe('HistoryPanel', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders empty state when there are no history entries', () => {
    const wrapper = mount(HistoryPanel)
    expect(wrapper.text()).toContain('No history yet.')
  })

  it('loads request and response stores when clicking a history item', async () => {
    const historyStore = useHistoryStore()
    const requestStore = useRequestStore()
    const responseStore = useResponseStore()

    historyStore.entries = [
      {
        id: 'h-1',
        requestId: 'req-1',
        workspaceId: 'ws-1',
        method: 'POST',
        url: 'https://api.example.com/users',
        requestHeaders: JSON.stringify([{ key: 'Content-Type', value: 'application/json', enabled: true }]),
        requestBody: '{"name":"Alice"}',
        statusCode: 201,
        responseHeaders: JSON.stringify({ 'content-type': 'application/json' }),
        responseBody: '{"id":1}',
        responseSizeBytes: 10,
        responseTimeMs: 120,
        errorMessage: null,
        executedAt: '2026-01-01T00:00:00Z',
      },
    ]

    const wrapper = mount(HistoryPanel)
    await wrapper.find('button').trigger('click')

    expect(requestStore.method).toBe('POST')
    expect(requestStore.url).toBe('https://api.example.com/users')
    expect(requestStore.currentRequestId).toBe('req-1')
    expect(requestStore.currentRequestName).toBeNull()
    expect(requestStore.headers).toEqual([{ key: 'Content-Type', value: 'application/json', enabled: true }])
    expect(requestStore.bodyContent).toBe('{"name":"Alice"}')
    expect(requestStore.bodyType).toBe('text')

    expect(responseStore.statusCode).toBe(201)
    expect(responseStore.body).toBe('{"id":1}')
    expect(responseStore.size).toBe(10)
    expect(responseStore.headers).toEqual({ 'content-type': 'application/json' })
    expect(responseStore.error).toBeNull()
  })

  it('sets response error when status code is null and error message exists', async () => {
    const historyStore = useHistoryStore()
    const responseStore = useResponseStore()

    historyStore.entries = [
      {
        id: 'h-2',
        requestId: null,
        workspaceId: 'ws-1',
        method: 'GET',
        url: 'https://api.example.com/fail',
        requestHeaders: null,
        requestBody: null,
        statusCode: null,
        responseHeaders: null,
        responseBody: null,
        responseSizeBytes: null,
        responseTimeMs: null,
        errorMessage: 'Network timeout',
        executedAt: '2026-01-01T00:01:00Z',
      },
    ]

    const wrapper = mount(HistoryPanel)
    await wrapper.find('button').trigger('click')

    expect(responseStore.statusCode).toBeNull()
    expect(responseStore.error).toBe('Network timeout')
  })
})
