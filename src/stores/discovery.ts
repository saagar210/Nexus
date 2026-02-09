import { defineStore } from 'pinia'
import { ref, computed, onUnmounted } from 'vue'
import type { DiscoveredEndpoint, DiscoveryProgress } from '@shared/ipc-types'

export const useDiscoveryStore = defineStore('discovery', () => {
  const endpoints = ref<DiscoveredEndpoint[]>([])
  const isDiscovering = ref(false)
  const progress = ref<DiscoveryProgress | null>(null)
  const isLoading = ref(false)

  let unsubscribe: (() => void) | null = null

  const groupedEndpoints = computed(() => {
    const groups = new Map<string, DiscoveredEndpoint[]>()

    for (const ep of endpoints.value) {
      const tag = ep.tags.length > 0 ? ep.tags[0] : 'default'
      if (!groups.has(tag)) groups.set(tag, [])
      groups.get(tag)!.push(ep)
    }

    return groups
  })

  function setupProgressListener(): void {
    if (unsubscribe) return
    unsubscribe = window.api.on('discovery:progress', (data: unknown) => {
      progress.value = data as DiscoveryProgress
      if ((data as DiscoveryProgress).step === 'complete') {
        isDiscovering.value = false
      }
    })
  }

  function cleanupProgressListener(): void {
    unsubscribe?.()
    unsubscribe = null
  }

  async function startDiscovery(workspaceId: string, baseUrl: string): Promise<void> {
    isDiscovering.value = true
    progress.value = { step: 'starting', message: 'Starting discovery...', progress: 0, endpointsFound: 0 }

    setupProgressListener()

    const result = await window.api.invoke('discovery:start', { workspaceId, baseUrl })

    if (result.success) {
      endpoints.value = result.data.endpoints
    }

    isDiscovering.value = false
  }

  async function cancelDiscovery(): Promise<void> {
    await window.api.invoke('discovery:cancel')
    isDiscovering.value = false
    progress.value = null
  }

  async function fetchEndpoints(workspaceId: string): Promise<void> {
    isLoading.value = true
    const result = await window.api.invoke('db:discovery:list', { workspaceId })
    if (result.success) endpoints.value = result.data
    isLoading.value = false
  }

  async function clearEndpoints(workspaceId: string): Promise<void> {
    await window.api.invoke('db:discovery:clear', { workspaceId })
    endpoints.value = []
  }

  return {
    endpoints, isDiscovering, progress, isLoading, groupedEndpoints,
    startDiscovery, cancelDiscovery, fetchEndpoints, clearEndpoints,
    setupProgressListener, cleanupProgressListener,
  }
})
