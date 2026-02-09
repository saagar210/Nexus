<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useDiscoveryStore } from '@/stores/discovery'
import { useWorkspaceStore } from '@/stores/workspace'
import { useCollectionStore } from '@/stores/collection'
import { useRequestStore } from '@/stores/request'
import type { DiscoveredEndpoint } from '@shared/ipc-types'
import DiscoveryStepper from './DiscoveryStepper.vue'
import EndpointCard from './EndpointCard.vue'

const discoveryStore = useDiscoveryStore()
const workspaceStore = useWorkspaceStore()
const collectionStore = useCollectionStore()
const requestStore = useRequestStore()

const discoveryUrl = ref(workspaceStore.currentWorkspace?.baseUrl || '')

onMounted(() => {
  discoveryStore.setupProgressListener()
  if (workspaceStore.currentWorkspace) {
    discoveryStore.fetchEndpoints(workspaceStore.currentWorkspace.id)
  }
})

onUnmounted(() => {
  discoveryStore.cleanupProgressListener()
})

async function startDiscovery() {
  if (!workspaceStore.currentWorkspace || !discoveryUrl.value.trim()) return
  await discoveryStore.startDiscovery(workspaceStore.currentWorkspace.id, discoveryUrl.value.trim())
}

function useEndpoint(endpoint: DiscoveredEndpoint) {
  const baseUrl = discoveryUrl.value.replace(/\/$/, '')
  requestStore.method = endpoint.method
  requestStore.url = `${baseUrl}${endpoint.path}`
  requestStore.currentRequestId = null
  requestStore.currentRequestName = null
  requestStore.isDirty = false
}

async function saveAsRequest(endpoint: DiscoveredEndpoint) {
  if (!workspaceStore.currentWorkspace) return
  const baseUrl = discoveryUrl.value.replace(/\/$/, '')
  await collectionStore.saveRequest(workspaceStore.currentWorkspace.id, {
    name: endpoint.summary || `${endpoint.method} ${endpoint.path}`,
    method: endpoint.method,
    url: `${baseUrl}${endpoint.path}`,
    headers: [],
    queryParams: [],
    bodyType: null,
    bodyContent: null,
    authType: null,
    authConfig: null,
  })
}

async function generateCollection() {
  if (!workspaceStore.currentWorkspace) return
  const col = await collectionStore.createCollection(
    workspaceStore.currentWorkspace.id,
    'Discovered API'
  )
  if (!col) return

  for (const endpoint of discoveryStore.endpoints) {
    const baseUrl = discoveryUrl.value.replace(/\/$/, '')
    await collectionStore.saveRequest(workspaceStore.currentWorkspace.id, {
      name: endpoint.summary || `${endpoint.method} ${endpoint.path}`,
      method: endpoint.method,
      url: `${baseUrl}${endpoint.path}`,
      headers: [],
      queryParams: [],
      bodyType: null,
      bodyContent: null,
      authType: null,
      authConfig: null,
      collectionId: col.id,
    })
  }
}

async function clearEndpoints() {
  if (!workspaceStore.currentWorkspace) return
  await discoveryStore.clearEndpoints(workspaceStore.currentWorkspace.id)
}
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Discovery input -->
    <div class="flex gap-1 pb-2 mb-2 border-b border-nexus-border">
      <input
        v-model="discoveryUrl"
        placeholder="Base URL (e.g. https://api.example.com)"
        class="flex-1 bg-nexus-bg border border-nexus-border rounded px-2 py-1 text-xs text-nexus-text font-mono placeholder-nexus-text-muted/40 focus:outline-none focus:border-nexus-accent"
        @keydown.enter="startDiscovery"
      />
      <button
        class="px-2 py-1 rounded text-xs font-medium transition-colors"
        :class="discoveryStore.isDiscovering
          ? 'bg-nexus-error text-white hover:bg-nexus-error/80'
          : 'bg-nexus-accent text-white hover:bg-nexus-accent/80'"
        @click="discoveryStore.isDiscovering ? discoveryStore.cancelDiscovery() : startDiscovery()"
      >
        {{ discoveryStore.isDiscovering ? 'Cancel' : 'Discover' }}
      </button>
    </div>

    <!-- Progress stepper -->
    <DiscoveryStepper
      v-if="discoveryStore.progress && discoveryStore.isDiscovering"
      :progress="discoveryStore.progress"
    />

    <!-- Results -->
    <div v-if="discoveryStore.endpoints.length > 0" class="flex-1 overflow-y-auto">
      <!-- Actions bar -->
      <div class="flex items-center justify-between mb-2">
        <span class="text-[10px] text-nexus-text-muted">
          {{ discoveryStore.endpoints.length }} endpoints found
        </span>
        <div class="flex gap-1">
          <button
            class="text-[10px] text-nexus-accent hover:text-nexus-accent/80 px-1.5 py-0.5 rounded hover:bg-nexus-border"
            @click="generateCollection"
          >
            Generate Collection
          </button>
          <button
            class="text-[10px] text-nexus-text-muted hover:text-nexus-error px-1.5 py-0.5 rounded hover:bg-nexus-border"
            @click="clearEndpoints"
          >
            Clear
          </button>
        </div>
      </div>

      <!-- Grouped endpoints -->
      <div v-for="[tag, eps] in discoveryStore.groupedEndpoints" :key="tag" class="mb-3">
        <div class="text-[10px] font-medium text-nexus-text-muted uppercase tracking-wider px-2 mb-1">{{ tag }}</div>
        <EndpointCard
          v-for="ep in eps"
          :key="ep.id"
          :endpoint="ep"
          @use-endpoint="useEndpoint"
          @save-request="saveAsRequest"
        />
      </div>
    </div>

    <!-- Empty state -->
    <div v-else-if="!discoveryStore.isDiscovering" class="flex flex-col items-center justify-center flex-1 text-nexus-text-muted text-xs text-center">
      <p>Enter a base URL to discover API endpoints.</p>
      <p class="mt-1 text-[11px]">Nexus probes for OpenAPI/Swagger specs automatically.</p>
    </div>
  </div>
</template>
