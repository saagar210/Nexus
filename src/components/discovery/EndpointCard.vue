<script setup lang="ts">
import type { DiscoveredEndpoint } from '@shared/ipc-types'
import MethodBadge from '@/components/collection/MethodBadge.vue'

defineProps<{
  endpoint: DiscoveredEndpoint
}>()

const emit = defineEmits<{
  'use-endpoint': [endpoint: DiscoveredEndpoint]
  'save-request': [endpoint: DiscoveredEndpoint]
}>()
</script>

<template>
  <div
    class="flex items-center gap-2 px-2 py-1.5 rounded transition-colors hover:bg-nexus-border/50 group cursor-pointer"
    @click="emit('use-endpoint', endpoint)"
  >
    <MethodBadge :method="endpoint.method" />
    <span class="text-xs font-mono text-nexus-text truncate flex-1">{{ endpoint.path }}</span>
    <span v-if="endpoint.summary" class="text-[10px] text-nexus-text-muted truncate max-w-[120px]">{{ endpoint.summary }}</span>
    <span v-if="endpoint.deprecated" class="text-[9px] text-nexus-warning px-1 rounded bg-nexus-warning/10">deprecated</span>
    <button
      class="text-[10px] text-nexus-accent hover:text-nexus-accent/80 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
      @click.stop="emit('save-request', endpoint)"
    >
      Save
    </button>
  </div>
</template>
