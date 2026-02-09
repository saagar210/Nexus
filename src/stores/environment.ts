import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Environment, EnvVariable } from '@shared/ipc-types'

export const useEnvironmentStore = defineStore('environment', () => {
  const environments = ref<Environment[]>([])
  const activeEnvironment = ref<Environment | null>(null)
  const variables = ref<EnvVariable[]>([])
  const isLoading = ref(false)

  const resolvedVariables = computed<Record<string, string>>(() => {
    const map: Record<string, string> = {}
    for (const v of variables.value) {
      map[v.key] = v.value
    }
    return map
  })

  async function fetchAll(workspaceId: string): Promise<void> {
    isLoading.value = true
    const [envResult, activeResult] = await Promise.all([
      window.api.invoke('db:env:list', { workspaceId }),
      window.api.invoke('db:env:getActive', { workspaceId }),
    ])
    if (envResult.success) environments.value = envResult.data
    if (activeResult.success) {
      activeEnvironment.value = activeResult.data
      if (activeResult.data) {
        await fetchVariables(activeResult.data.id)
      } else {
        variables.value = []
      }
    }
    isLoading.value = false
  }

  async function create(workspaceId: string, name: string): Promise<Environment | null> {
    const result = await window.api.invoke('db:env:create', { workspaceId, name })
    if (result.success) {
      await fetchAll(workspaceId)
      return result.data
    }
    return null
  }

  async function update(id: string, name: string, workspaceId: string): Promise<void> {
    await window.api.invoke('db:env:update', { id, name })
    await fetchAll(workspaceId)
  }

  async function remove(id: string, workspaceId: string): Promise<void> {
    await window.api.invoke('db:env:delete', { id })
    await fetchAll(workspaceId)
  }

  async function setActive(workspaceId: string, environmentId: string | null): Promise<void> {
    await window.api.invoke('db:env:setActive', { workspaceId, environmentId })
    await fetchAll(workspaceId)
  }

  async function fetchVariables(environmentId: string): Promise<void> {
    const result = await window.api.invoke('db:env:variables:list', { environmentId })
    if (result.success) variables.value = result.data
  }

  async function setVariable(environmentId: string, key: string, value: string, isSecret?: boolean): Promise<void> {
    await window.api.invoke('db:env:variables:set', { environmentId, key, value, isSecret })
    await fetchVariables(environmentId)
  }

  async function deleteVariable(id: string, environmentId: string): Promise<void> {
    await window.api.invoke('db:env:variables:delete', { id })
    await fetchVariables(environmentId)
  }

  async function getResolvedVariablesFromDb(workspaceId: string): Promise<Record<string, string>> {
    const result = await window.api.invoke('db:env:resolvedVariables', { workspaceId })
    if (result.success) return result.data
    return {}
  }

  return {
    environments, activeEnvironment, variables, isLoading, resolvedVariables,
    fetchAll, create, update, remove, setActive,
    fetchVariables, setVariable, deleteVariable, getResolvedVariablesFromDb,
  }
})
