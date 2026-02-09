import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Workspace } from '@shared/ipc-types'

export const useWorkspaceStore = defineStore('workspace', () => {
  const currentWorkspace = ref<Workspace | null>(null)

  async function loadDefault(): Promise<void> {
    const result = await window.api.invoke('db:workspace:getDefault')
    if (result.success) {
      currentWorkspace.value = result.data
    }
  }

  return { currentWorkspace, loadDefault }
})
