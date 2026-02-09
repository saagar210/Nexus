<script setup lang="ts">
import { ref } from 'vue'
import { useCollectionStore } from '@/stores/collection'
import { useWorkspaceStore } from '@/stores/workspace'
import { useHistoryStore } from '@/stores/history'
import CollectionTree from '@/components/collection/CollectionTree.vue'
import HistoryPanel from '@/components/history/HistoryPanel.vue'
import DiscoveryPanel from '@/components/discovery/DiscoveryPanel.vue'

const collectionStore = useCollectionStore()
const workspaceStore = useWorkspaceStore()
const historyStore = useHistoryStore()

const activeTab = ref<'collections' | 'history' | 'discovery'>('collections')

const emit = defineEmits<{
  'new-request': []
}>()

async function handleNewCollection() {
  if (!workspaceStore.currentWorkspace) return
  await collectionStore.createCollection(workspaceStore.currentWorkspace.id, 'New Collection')
}

async function handleImportPostman() {
  const fileResult = await window.api.invoke('dialog:openFile', {
    filters: [{ name: 'Postman Collection', extensions: ['json'] }],
  })
  if (!fileResult.success || !fileResult.data) return
  if (!workspaceStore.currentWorkspace) return

  const importResult = await window.api.invoke('import:postman', {
    filePath: fileResult.data,
    workspaceId: workspaceStore.currentWorkspace.id,
  })

  if (importResult.success) {
    await collectionStore.fetchAll(workspaceStore.currentWorkspace.id)
  }
}

function switchTab(tab: typeof activeTab.value) {
  activeTab.value = tab
  if (tab === 'history' && workspaceStore.currentWorkspace) {
    historyStore.fetchHistory(workspaceStore.currentWorkspace.id)
  }
}

const hasItems = ref(true)
</script>

<template>
  <aside class="flex flex-col bg-nexus-surface border-r border-nexus-border overflow-hidden">
    <!-- Tab bar -->
    <div class="flex border-b border-nexus-border">
      <button
        v-for="tab in (['collections', 'history', 'discovery'] as const)"
        :key="tab"
        class="flex-1 px-2 py-1.5 text-[10px] font-medium uppercase tracking-wider transition-colors"
        :class="activeTab === tab
          ? 'text-nexus-accent border-b border-nexus-accent'
          : 'text-nexus-text-muted hover:text-nexus-text'"
        @click="switchTab(tab)"
      >
        {{ tab === 'collections' ? 'Collections' : tab === 'history' ? 'History' : 'Discovery' }}
      </button>
    </div>

    <!-- Actions bar (collections tab) -->
    <div v-if="activeTab === 'collections'" class="flex items-center justify-between px-3 py-1.5 border-b border-nexus-border">
      <div class="flex gap-1">
        <button
          class="p-1 rounded hover:bg-nexus-border text-nexus-text-muted hover:text-nexus-text transition-colors"
          title="New Request (Cmd+N)"
          @click="emit('new-request')"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
        <button
          class="p-1 rounded hover:bg-nexus-border text-nexus-text-muted hover:text-nexus-text transition-colors"
          title="New Collection"
          @click="handleNewCollection"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
          </svg>
        </button>
      </div>
      <button
        class="text-[10px] text-nexus-text-muted hover:text-nexus-text transition-colors px-1.5 py-0.5 rounded hover:bg-nexus-border"
        @click="handleImportPostman"
      >
        Import
      </button>
    </div>

    <!-- Content area -->
    <div class="flex-1 overflow-y-auto p-2">
      <!-- Collections tab -->
      <template v-if="activeTab === 'collections'">
        <CollectionTree v-if="collectionStore.treeNodes.length > 0" />
        <div v-else class="flex flex-col items-center justify-center h-full text-nexus-text-muted text-xs text-center px-4">
          <p>No saved requests yet.</p>
          <p class="mt-1 text-[11px]">Send a request and save it with Cmd+S</p>
        </div>
      </template>

      <!-- History tab -->
      <HistoryPanel v-if="activeTab === 'history'" />

      <!-- Discovery tab -->
      <DiscoveryPanel v-if="activeTab === 'discovery'" />
    </div>
  </aside>
</template>
