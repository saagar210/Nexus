<script setup lang="ts">
import { computed } from 'vue'
import type { HistoryEntry } from '@shared/ipc-types'
import MethodBadge from '@/components/collection/MethodBadge.vue'

const props = defineProps<{
  entry: HistoryEntry
}>()

const statusColor = computed(() => {
  if (!props.entry.statusCode) return 'text-nexus-text-muted'
  if (props.entry.statusCode < 300) return 'text-nexus-success'
  if (props.entry.statusCode < 400) return 'text-nexus-warning'
  return 'text-nexus-error'
})

const timeAgo = computed(() => {
  const date = new Date(props.entry.executedAt)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  return date.toLocaleDateString()
})

const shortUrl = computed(() => {
  try {
    const url = new URL(props.entry.url)
    return url.pathname + url.search
  } catch {
    return props.entry.url
  }
})
</script>

<template>
  <button
    class="flex items-center gap-2 px-2 py-1.5 rounded text-left w-full transition-colors text-nexus-text-muted hover:bg-nexus-border/50 hover:text-nexus-text"
  >
    <MethodBadge :method="entry.method" />
    <span class="text-xs truncate flex-1 font-mono">{{ shortUrl }}</span>
    <span v-if="entry.statusCode" class="text-[10px] font-mono" :class="statusColor">{{ entry.statusCode }}</span>
    <span class="text-[9px] text-nexus-text-muted/60 flex-shrink-0">{{ timeAgo }}</span>
  </button>
</template>
