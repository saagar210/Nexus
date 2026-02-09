<script setup lang="ts">
import { useWorkspaceStore } from '@/stores/workspace'
import EnvSelector from '@/components/environment/EnvSelector.vue'

const workspaceStore = useWorkspaceStore()
</script>

<template>
  <header class="flex items-center justify-between px-4 bg-nexus-surface border-b border-nexus-border select-none"
          style="-webkit-app-region: drag">
    <div class="font-semibold text-sm tracking-wide" style="-webkit-app-region: no-drag">
      Nexus
    </div>
    <div class="text-xs text-nexus-text-muted">
      {{ workspaceStore.currentWorkspace?.name || 'Default Workspace' }}
    </div>
    <EnvSelector />
  </header>
</template>
