import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { nanoid } from 'nanoid'
import type { SavedRequest, Collection } from '@shared/ipc-types'

export interface TreeNode {
  type: 'collection' | 'request'
  data: Collection | SavedRequest
  children: TreeNode[]
}

export const useCollectionStore = defineStore('collection', () => {
  const collections = ref<Collection[]>([])
  const requests = ref<SavedRequest[]>([])
  const isLoading = ref(false)

  const treeNodes = computed<TreeNode[]>(() => {
    const collectionMap = new Map<string, TreeNode>()

    // Create nodes for all collections
    for (const col of collections.value) {
      collectionMap.set(col.id, {
        type: 'collection',
        data: col,
        children: [],
      })
    }

    // Nest child collections under parents
    const rootNodes: TreeNode[] = []
    for (const col of collections.value) {
      const node = collectionMap.get(col.id)!
      if (col.parentId && collectionMap.has(col.parentId)) {
        collectionMap.get(col.parentId)!.children.push(node)
      } else {
        rootNodes.push(node)
      }
    }

    // Place requests into their collections or at root
    for (const req of requests.value) {
      const reqNode: TreeNode = { type: 'request', data: req, children: [] }
      if (req.collectionId && collectionMap.has(req.collectionId)) {
        collectionMap.get(req.collectionId)!.children.push(reqNode)
      } else {
        rootNodes.push(reqNode)
      }
    }

    return rootNodes
  })

  async function fetchAll(workspaceId: string): Promise<void> {
    isLoading.value = true
    const [colResult, reqResult] = await Promise.all([
      window.api.invoke('db:collection:list', { workspaceId }),
      window.api.invoke('db:request:list', { workspaceId }),
    ])
    if (colResult.success) collections.value = colResult.data
    if (reqResult.success) requests.value = reqResult.data
    isLoading.value = false
  }

  async function createCollection(workspaceId: string, name: string, parentId?: string | null): Promise<Collection | null> {
    const result = await window.api.invoke('db:collection:create', {
      workspaceId,
      name,
      parentId: parentId ?? null,
    })
    if (result.success) {
      await fetchAll(workspaceId)
      return result.data
    }
    return null
  }

  async function updateCollection(id: string, updates: { name?: string; parentId?: string | null }, workspaceId: string): Promise<void> {
    await window.api.invoke('db:collection:update', { id, ...updates })
    await fetchAll(workspaceId)
  }

  async function deleteCollection(id: string, workspaceId: string): Promise<void> {
    await window.api.invoke('db:collection:delete', { id })
    await fetchAll(workspaceId)
  }

  async function reorderItems(
    collectionUpdates: Array<{ id: string; sortOrder: number; parentId?: string | null }>,
    requestUpdates: Array<{ id: string; sortOrder: number; collectionId?: string | null }>
  ): Promise<void> {
    await Promise.all([
      collectionUpdates.length > 0
        ? window.api.invoke('db:collection:reorder', { items: collectionUpdates })
        : Promise.resolve(),
      requestUpdates.length > 0
        ? window.api.invoke('db:request:reorder', { items: requestUpdates })
        : Promise.resolve(),
    ])
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
      collectionId?: string | null
    }
  ): Promise<SavedRequest | null> {
    const id = requestData.id ?? nanoid()

    const result = await window.api.invoke('db:request:save', {
      id,
      collectionId: requestData.collectionId ?? null,
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

  return {
    collections, requests, isLoading, treeNodes,
    fetchAll, createCollection, updateCollection, deleteCollection,
    reorderItems, saveRequest, deleteRequest,
  }
})
