import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { HttpResponse, RequestTiming } from '@shared/ipc-types'

export const useResponseStore = defineStore('response', () => {
  const isLoading = ref(false)
  const statusCode = ref<number | null>(null)
  const statusText = ref('')
  const headers = ref<Record<string, string>>({})
  const body = ref('')
  const size = ref(0)
  const timing = ref<RequestTiming | null>(null)
  const error = ref<string | null>(null)
  const isTruncated = ref(false)

  function setFromResponse(response: HttpResponse): void {
    statusCode.value = response.statusCode
    statusText.value = response.statusText
    headers.value = response.headers
    body.value = response.body
    size.value = response.size
    timing.value = response.timing
    isTruncated.value = response.isTruncated
    error.value = null
  }

  function setError(message: string): void {
    statusCode.value = null
    statusText.value = ''
    headers.value = {}
    body.value = ''
    size.value = 0
    timing.value = null
    isTruncated.value = false
    error.value = message
  }

  function reset(): void {
    isLoading.value = false
    statusCode.value = null
    statusText.value = ''
    headers.value = {}
    body.value = ''
    size.value = 0
    timing.value = null
    isTruncated.value = false
    error.value = null
  }

  return {
    isLoading, statusCode, statusText, headers, body,
    size, timing, error, isTruncated,
    setFromResponse, setError, reset,
  }
})
