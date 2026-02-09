<script setup lang="ts">
import { ref, watch } from 'vue'
import { useEnvironmentStore } from '@/stores/environment'
import { useWorkspaceStore } from '@/stores/workspace'
import type { EnvVariable } from '@shared/ipc-types'

const emit = defineEmits<{
  close: []
}>()

const envStore = useEnvironmentStore()
const workspaceStore = useWorkspaceStore()

const selectedEnvId = ref<string | null>(envStore.activeEnvironment?.id ?? null)
const editingVariables = ref<EnvVariable[]>([])
const newVarKey = ref('')
const newVarValue = ref('')
const newVarSecret = ref(false)
const newEnvName = ref('')

watch(selectedEnvId, async (envId) => {
  if (envId) {
    await envStore.fetchVariables(envId)
    editingVariables.value = [...envStore.variables]
  } else {
    editingVariables.value = []
  }
}, { immediate: true })

async function handleCreateEnv() {
  if (!workspaceStore.currentWorkspace || !newEnvName.value.trim()) return
  const env = await envStore.create(workspaceStore.currentWorkspace.id, newEnvName.value.trim())
  if (env) {
    selectedEnvId.value = env.id
    newEnvName.value = ''
  }
}

async function handleDeleteEnv(envId: string) {
  if (!workspaceStore.currentWorkspace) return
  await envStore.remove(envId, workspaceStore.currentWorkspace.id)
  if (selectedEnvId.value === envId) {
    selectedEnvId.value = envStore.environments[0]?.id ?? null
  }
}

async function handleAddVariable() {
  if (!selectedEnvId.value || !newVarKey.value.trim()) return
  await envStore.setVariable(selectedEnvId.value, newVarKey.value.trim(), newVarValue.value, newVarSecret.value)
  editingVariables.value = [...envStore.variables]
  newVarKey.value = ''
  newVarValue.value = ''
  newVarSecret.value = false
}

async function handleUpdateVariable(variable: EnvVariable) {
  if (!selectedEnvId.value) return
  await envStore.setVariable(selectedEnvId.value, variable.key, variable.value, variable.isSecret)
}

async function handleDeleteVariable(id: string) {
  if (!selectedEnvId.value) return
  await envStore.deleteVariable(id, selectedEnvId.value)
  editingVariables.value = [...envStore.variables]
}
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Header -->
    <div class="flex items-center justify-between px-4 py-3 border-b border-nexus-border">
      <h2 class="text-sm font-semibold">Manage Environments</h2>
      <button class="p-1 rounded hover:bg-nexus-border text-nexus-text-muted hover:text-nexus-text" @click="emit('close')">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>

    <div class="flex flex-1 overflow-hidden">
      <!-- Left: Environment list -->
      <div class="w-48 border-r border-nexus-border flex flex-col">
        <div class="flex-1 overflow-y-auto p-2">
          <button
            v-for="env in envStore.environments"
            :key="env.id"
            class="w-full flex items-center justify-between px-2 py-1.5 rounded text-xs transition-colors group"
            :class="selectedEnvId === env.id
              ? 'bg-nexus-accent/10 text-nexus-text'
              : 'text-nexus-text-muted hover:bg-nexus-border/50'"
            @click="selectedEnvId = env.id"
          >
            <span class="truncate">{{ env.name }}</span>
            <button
              class="p-0.5 rounded hover:text-nexus-error opacity-0 group-hover:opacity-100"
              @click.stop="handleDeleteEnv(env.id)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          </button>
        </div>
        <div class="p-2 border-t border-nexus-border">
          <div class="flex gap-1">
            <input
              v-model="newEnvName"
              placeholder="New env..."
              class="flex-1 bg-nexus-bg border border-nexus-border rounded px-2 py-1 text-xs text-nexus-text placeholder-nexus-text-muted/40 focus:outline-none focus:border-nexus-accent"
              @keydown.enter="handleCreateEnv"
            />
            <button
              class="px-2 py-1 rounded bg-nexus-accent text-white text-xs hover:bg-nexus-accent/80"
              @click="handleCreateEnv"
            >
              Add
            </button>
          </div>
        </div>
      </div>

      <!-- Right: Variables editor -->
      <div class="flex-1 flex flex-col overflow-hidden">
        <div v-if="selectedEnvId" class="flex-1 overflow-y-auto p-3">
          <table class="w-full">
            <thead>
              <tr class="text-[10px] text-nexus-text-muted uppercase tracking-wider">
                <th class="text-left pb-2 font-medium">Key</th>
                <th class="text-left pb-2 font-medium">Value</th>
                <th class="text-center pb-2 font-medium w-14">Secret</th>
                <th class="w-8"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="v in editingVariables" :key="v.id" class="group">
                <td class="py-0.5 pr-2">
                  <span class="text-xs font-mono text-nexus-text">{{ v.key }}</span>
                </td>
                <td class="py-0.5 pr-2">
                  <input
                    :value="v.value"
                    :type="v.isSecret ? 'password' : 'text'"
                    class="w-full bg-transparent text-xs font-mono text-nexus-text focus:outline-none focus:bg-nexus-bg rounded px-1"
                    @change="handleUpdateVariable({ ...v, value: ($event.target as HTMLInputElement).value })"
                  />
                </td>
                <td class="py-0.5 text-center">
                  <input
                    type="checkbox"
                    :checked="v.isSecret"
                    class="w-3 h-3 accent-nexus-accent"
                    @change="handleUpdateVariable({ ...v, isSecret: !v.isSecret })"
                  />
                </td>
                <td class="py-0.5">
                  <button
                    class="p-0.5 rounded text-nexus-text-muted hover:text-nexus-error opacity-0 group-hover:opacity-100"
                    @click="handleDeleteVariable(v.id)"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none"
                         stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                  </button>
                </td>
              </tr>
              <!-- Add new variable row -->
              <tr class="opacity-60 hover:opacity-100">
                <td class="py-0.5 pr-2">
                  <input
                    v-model="newVarKey"
                    placeholder="key"
                    class="w-full bg-nexus-bg border border-nexus-border rounded px-1 py-0.5 text-xs font-mono text-nexus-text placeholder-nexus-text-muted/40 focus:outline-none focus:border-nexus-accent"
                    @keydown.enter="handleAddVariable"
                  />
                </td>
                <td class="py-0.5 pr-2">
                  <input
                    v-model="newVarValue"
                    placeholder="value"
                    class="w-full bg-nexus-bg border border-nexus-border rounded px-1 py-0.5 text-xs font-mono text-nexus-text placeholder-nexus-text-muted/40 focus:outline-none focus:border-nexus-accent"
                    @keydown.enter="handleAddVariable"
                  />
                </td>
                <td class="py-0.5 text-center">
                  <input v-model="newVarSecret" type="checkbox" class="w-3 h-3 accent-nexus-accent" />
                </td>
                <td class="py-0.5">
                  <button
                    class="p-0.5 rounded text-nexus-accent hover:text-nexus-accent/80"
                    @click="handleAddVariable"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none"
                         stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="flex-1 flex items-center justify-center text-nexus-text-muted text-xs">
          Select an environment to edit variables
        </div>
      </div>
    </div>
  </div>
</template>
