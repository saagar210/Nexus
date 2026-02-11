<script setup lang="ts">
import { useHistoryStore } from '@/stores/history'
import type { HistoryEntry } from '@shared/ipc-types'
import { useRequestStore } from '@/stores/request'
import { useResponseStore } from '@/stores/response'
import HistoryItem from './HistoryItem.vue'

const historyStore = useHistoryStore()
const requestStore = useRequestStore()
const responseStore = useResponseStore()

const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'] as const

function loadFromHistory(entry: HistoryEntry) {
  requestStore.method = entry.method
  requestStore.url = entry.url
  requestStore.currentRequestId = entry.requestId
  requestStore.currentRequestName = null
  requestStore.isDirty = false

  if (entry.requestHeaders) {
    try {
      requestStore.headers = JSON.parse(entry.requestHeaders)
    } catch { /* ignore */ }
  }

  if (entry.requestBody) {
    requestStore.bodyContent = entry.requestBody
    requestStore.bodyType = 'text'
  }

  // Load response if available
  if (entry.statusCode !== null) {
    responseStore.statusCode = entry.statusCode
    responseStore.statusText = ''
    responseStore.body = entry.responseBody || ''
    responseStore.size = entry.responseSizeBytes || 0
    if (entry.responseHeaders) {
      try {
        responseStore.headers = JSON.parse(entry.responseHeaders)
      } catch { /* ignore */ }
    }
    responseStore.error = entry.errorMessage
  } else if (entry.errorMessage) {
    responseStore.setError(entry.errorMessage)
  }
}
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Filter bar -->
    <div class="flex flex-col gap-1.5 pb-2 mb-2 border-b border-nexus-border">
      <select
        v-model="historyStore.filters.method"
        class="bg-nexus-bg border border-nexus-border rounded px-2 py-1 text-xs text-nexus-text focus:outline-none focus:border-nexus-accent"
      >
        <option :value="null">All Methods</option>
        <option v-for="m in methods" :key="m" :value="m">{{ m }}</option>
      </select>
      <input
        v-model="historyStore.filters.urlPattern"
        placeholder="Filter by URL..."
        class="bg-nexus-bg border border-nexus-border rounded px-2 py-1 text-xs text-nexus-text placeholder-nexus-text-muted/40 focus:outline-none focus:border-nexus-accent"
      />
      <input
        v-model="historyStore.filters.statusCode"
        placeholder="Status code..."
        class="bg-nexus-bg border border-nexus-border rounded px-2 py-1 text-xs text-nexus-text placeholder-nexus-text-muted/40 focus:outline-none focus:border-nexus-accent"
      />
    </div>

    <!-- History entries -->
    <div v-if="historyStore.filteredEntries.length > 0" class="flex flex-col gap-0.5 overflow-y-auto">
      <HistoryItem
        v-for="entry in historyStore.filteredEntries"
        :key="entry.id"
        :entry="entry"
        @click="loadFromHistory(entry)"
      />
    </div>
    <div v-else class="flex flex-col items-center justify-center flex-1 text-nexus-text-muted text-xs text-center">
      <p>No history yet.</p>
      <p class="mt-1 text-[11px]">Requests will appear here after you send them.</p>
    </div>
  </div>
</template>
