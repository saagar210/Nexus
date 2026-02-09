import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { HistoryEntry } from '@shared/ipc-types'

export const useHistoryStore = defineStore('history', () => {
  const entries = ref<HistoryEntry[]>([])
  const isLoading = ref(false)

  const filters = ref<{
    method: string | null
    statusCode: string
    urlPattern: string
  }>({
    method: null,
    statusCode: '',
    urlPattern: '',
  })

  const filteredEntries = computed(() => {
    return entries.value.filter(entry => {
      if (filters.value.method && entry.method !== filters.value.method) return false
      if (filters.value.statusCode) {
        const code = parseInt(filters.value.statusCode, 10)
        if (!isNaN(code) && entry.statusCode !== code) return false
      }
      if (filters.value.urlPattern && !entry.url.toLowerCase().includes(filters.value.urlPattern.toLowerCase())) return false
      return true
    })
  })

  async function fetchHistory(workspaceId: string, limit = 100): Promise<void> {
    isLoading.value = true
    const result = await window.api.invoke('db:history:list', { workspaceId, limit })
    if (result.success) entries.value = result.data
    isLoading.value = false
  }

  function clearFilters(): void {
    filters.value = { method: null, statusCode: '', urlPattern: '' }
  }

  return {
    entries, isLoading, filters, filteredEntries,
    fetchHistory, clearFilters,
  }
})
