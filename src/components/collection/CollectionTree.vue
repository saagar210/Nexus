<script setup lang="ts">
import { computed } from 'vue'
import { useCollectionStore } from '@/stores/collection'
import { useRequestStore } from '@/stores/request'
import { useWorkspaceStore } from '@/stores/workspace'
import MethodBadge from './MethodBadge.vue'

const collectionStore = useCollectionStore()
const requestStore = useRequestStore()
const workspaceStore = useWorkspaceStore()

const emit = defineEmits<{
  'request-selected': [id: string]
}>()

async function loadRequest(id: string) {
  const result = await window.api.invoke('db:request:get', { id })
  if (result.success && result.data) {
    requestStore.loadFromSaved(result.data)
    emit('request-selected', id)
  }
}

async function handleDelete(id: string) {
  if (!workspaceStore.currentWorkspace) return
  await collectionStore.deleteRequest(id, workspaceStore.currentWorkspace.id)
  if (requestStore.currentRequestId === id) {
    requestStore.reset()
  }
}
</script>

<template>
  <div class="flex flex-col gap-0.5">
    <button
      v-for="req in collectionStore.requests"
      :key="req.id"
      class="flex items-center gap-2 px-2 py-1.5 rounded text-left w-full transition-colors group"
      :class="requestStore.currentRequestId === req.id
        ? 'bg-nexus-accent/10 text-nexus-text'
        : 'text-nexus-text-muted hover:bg-nexus-border/50 hover:text-nexus-text'"
      @click="loadRequest(req.id)"
      @contextmenu.prevent
    >
      <MethodBadge :method="req.method" />
      <span class="text-xs truncate flex-1">{{ req.name }}</span>
      <button
        class="p-0.5 rounded text-nexus-text-muted hover:text-nexus-error opacity-0 group-hover:opacity-100 transition-opacity"
        @click.stop="handleDelete(req.id)"
        title="Delete"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </button>
  </div>
</template>
