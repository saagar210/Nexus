<script setup lang="ts">
import { ref } from 'vue'
import { useEnvironmentStore } from '@/stores/environment'
import { useWorkspaceStore } from '@/stores/workspace'

const envStore = useEnvironmentStore()
const workspaceStore = useWorkspaceStore()

const showDropdown = ref(false)
const showEditor = ref(false)

async function selectEnvironment(envId: string | null) {
  if (!workspaceStore.currentWorkspace) return
  await envStore.setActive(workspaceStore.currentWorkspace.id, envId)
  showDropdown.value = false
}

function openEditor() {
  showDropdown.value = false
  showEditor.value = true
}
</script>

<template>
  <div class="relative" style="-webkit-app-region: no-drag">
    <button
      class="flex items-center gap-1.5 px-2 py-1 rounded text-xs hover:bg-nexus-border/50 transition-colors"
      @click="showDropdown = !showDropdown"
    >
      <span
        class="w-1.5 h-1.5 rounded-full"
        :class="envStore.activeEnvironment ? 'bg-green-400' : 'bg-nexus-text-muted/40'"
      />
      <span class="text-nexus-text-muted">
        {{ envStore.activeEnvironment?.name || 'No Environment' }}
      </span>
      <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </button>

    <!-- Dropdown -->
    <div v-if="showDropdown" class="absolute right-0 top-full mt-1 w-48 bg-nexus-surface border border-nexus-border rounded shadow-lg z-50">
      <button
        class="w-full text-left px-3 py-1.5 text-xs hover:bg-nexus-border/50 transition-colors flex items-center gap-2"
        :class="{ 'text-nexus-accent': !envStore.activeEnvironment }"
        @click="selectEnvironment(null)"
      >
        <span class="w-1.5 h-1.5 rounded-full bg-nexus-text-muted/40" />
        No Environment
      </button>
      <button
        v-for="env in envStore.environments"
        :key="env.id"
        class="w-full text-left px-3 py-1.5 text-xs hover:bg-nexus-border/50 transition-colors flex items-center gap-2"
        :class="{ 'text-nexus-accent': env.id === envStore.activeEnvironment?.id }"
        @click="selectEnvironment(env.id)"
      >
        <span
          class="w-1.5 h-1.5 rounded-full"
          :class="env.isActive ? 'bg-green-400' : 'bg-nexus-text-muted/40'"
        />
        {{ env.name }}
      </button>
      <div class="border-t border-nexus-border">
        <button
          class="w-full text-left px-3 py-1.5 text-xs text-nexus-text-muted hover:text-nexus-text hover:bg-nexus-border/50 transition-colors"
          @click="openEditor"
        >
          Manage Environments...
        </button>
      </div>
    </div>

    <!-- Click-away -->
    <div v-if="showDropdown" class="fixed inset-0 z-40" @click="showDropdown = false" />

    <!-- Environment Editor Dialog -->
    <Teleport to="body">
      <div v-if="showEditor" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="absolute inset-0 bg-black/50" @click="showEditor = false" />
        <div class="relative bg-nexus-surface border border-nexus-border rounded-lg shadow-2xl w-[600px] max-h-[500px] flex flex-col">
          <EnvEditor @close="showEditor = false" />
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script lang="ts">
import EnvEditor from './EnvEditor.vue'
</script>
