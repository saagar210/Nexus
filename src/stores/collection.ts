import { defineStore } from 'pinia'
import { ref } from 'vue'
import { nanoid } from 'nanoid'
import type { SavedRequest } from '@shared/ipc-types'

export const useCollectionStore = defineStore('collection', () => {
  const requests = ref<SavedRequest[]>([])
  const isLoading = ref(false)

  async function fetchAll(workspaceId: string): Promise<void> {
    isLoading.value = true
    const result = await window.api.invoke('db:request:list', { workspaceId })
    if (result.success) {
      requests.value = result.data
    }
    isLoading.value = false
  }

  async function saveRequest(
    workspaceId: string,
    requestData: {
      id?: string
      name: string
      method: string
      url: string
      headers: Array<{ key: string; value: string; enabled: boolean }>
      queryParams: Array<{ key: string; value: string; enabled: boolean }>
      bodyType: string | null
      bodyContent: string | null
      authType: string | null
      authConfig: Record<string, string> | null
    }
  ): Promise<SavedRequest | null> {
    const id = requestData.id ?? nanoid()

    const result = await window.api.invoke('db:request:save', {
      id,
      collectionId: null,
      workspaceId,
      name: requestData.name,
      method: requestData.method,
      url: requestData.url,
      headers: requestData.headers,
      queryParams: requestData.queryParams,
      bodyType: requestData.bodyType as SavedRequest['bodyType'],
      bodyContent: requestData.bodyContent,
      authType: requestData.authType as SavedRequest['authType'],
      authConfig: requestData.authConfig,
      sortOrder: 0,
    })

    if (result.success) {
      await fetchAll(workspaceId)
      return result.data
    }
    return null
  }

  async function deleteRequest(id: string, workspaceId: string): Promise<void> {
    await window.api.invoke('db:request:delete', { id })
    await fetchAll(workspaceId)
  }

  return { requests, isLoading, fetchAll, saveRequest, deleteRequest }
})
