import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useResponseStore } from '@/stores/response'
import type { HttpResponse } from '@shared/ipc-types'

describe('Response Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  const mockResponse: HttpResponse = {
    statusCode: 200,
    statusText: 'OK',
    headers: { 'content-type': 'application/json' },
    body: '{"message": "hello"}',
    size: 20,
    isTruncated: false,
    timing: {
      startTime: 1000,
      dnsTime: 0,
      connectTime: 0,
      tlsTime: 0,
      firstByteTime: 0,
      totalTime: 150,
    },
  }

  describe('setFromResponse', () => {
    it('populates all fields from response', () => {
      const store = useResponseStore()
      store.setFromResponse(mockResponse)

      expect(store.statusCode).toBe(200)
      expect(store.statusText).toBe('OK')
      expect(store.headers).toEqual({ 'content-type': 'application/json' })
      expect(store.body).toBe('{"message": "hello"}')
      expect(store.size).toBe(20)
      expect(store.timing?.totalTime).toBe(150)
      expect(store.isTruncated).toBe(false)
      expect(store.error).toBeNull()
    })

    it('clears previous error', () => {
      const store = useResponseStore()
      store.error = 'Previous error'
      store.setFromResponse(mockResponse)

      expect(store.error).toBeNull()
    })
  })

  describe('setError', () => {
    it('sets error and clears response data', () => {
      const store = useResponseStore()
      store.setFromResponse(mockResponse)

      store.setError('Connection refused')

      expect(store.error).toBe('Connection refused')
      expect(store.statusCode).toBeNull()
      expect(store.statusText).toBe('')
      expect(store.body).toBe('')
      expect(store.size).toBe(0)
      expect(store.timing).toBeNull()
      expect(store.headers).toEqual({})
    })
  })

  describe('reset', () => {
    it('clears all state', () => {
      const store = useResponseStore()
      store.setFromResponse(mockResponse)
      store.isLoading = true

      store.reset()

      expect(store.isLoading).toBe(false)
      expect(store.statusCode).toBeNull()
      expect(store.statusText).toBe('')
      expect(store.headers).toEqual({})
      expect(store.body).toBe('')
      expect(store.size).toBe(0)
      expect(store.timing).toBeNull()
      expect(store.isTruncated).toBe(false)
      expect(store.error).toBeNull()
    })
  })
})
