<script setup lang="ts">
import { computed } from 'vue'
import { useResponseStore } from '@/stores/response'

const responseStore = useResponseStore()

const statusText = computed(() => {
  if (responseStore.isLoading) return 'Sending...'
  if (responseStore.error) return 'Error'
  if (responseStore.statusCode) return `${responseStore.statusCode} ${responseStore.statusText}`
  return 'Ready'
})

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
</script>

<template>
  <footer class="flex items-center justify-between px-3 bg-nexus-bg border-t border-nexus-border text-[11px] text-nexus-text-muted">
    <span>{{ statusText }}</span>
    <div class="flex items-center gap-3">
      <span v-if="responseStore.timing">{{ responseStore.timing.totalTime }} ms</span>
      <span v-if="responseStore.size">{{ formatSize(responseStore.size) }}</span>
    </div>
  </footer>
</template>
