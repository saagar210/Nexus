<script setup lang="ts">
import { useRequestStore } from '@/stores/request'

const requestStore = useRequestStore()

const authTypes = [
  { value: 'none' as const, label: 'None' },
  { value: 'basic' as const, label: 'Basic' },
  { value: 'bearer' as const, label: 'Bearer Token' },
]
</script>

<template>
  <div class="h-full flex flex-col overflow-hidden">
    <!-- Auth type selector -->
    <div class="flex items-center gap-1 px-3 py-1.5 border-b border-nexus-border">
      <button
        v-for="at in authTypes"
        :key="at.value"
        class="px-2 py-0.5 rounded text-[10px] font-medium transition-colors"
        :class="requestStore.authType === at.value
          ? 'bg-nexus-accent/20 text-nexus-accent'
          : 'text-nexus-text-muted hover:text-nexus-text'"
        @click="requestStore.authType = at.value"
      >
        {{ at.label }}
      </button>
    </div>

    <div class="flex-1 overflow-auto p-3">
      <!-- None -->
      <div v-if="requestStore.authType === 'none'" class="flex items-center justify-center h-full text-xs text-nexus-text-muted">
        No authentication
      </div>

      <!-- Basic Auth -->
      <div v-else-if="requestStore.authType === 'basic'" class="space-y-3 max-w-md">
        <p class="text-[10px] text-nexus-text-muted">Authorization header will be added automatically.</p>
        <div>
          <label class="text-[10px] text-nexus-text-muted uppercase tracking-wider block mb-1">Username</label>
          <input
            type="text"
            :value="requestStore.authConfig.username || ''"
            @input="requestStore.authConfig = { ...requestStore.authConfig, username: ($event.target as HTMLInputElement).value }"
            class="w-full bg-nexus-bg border border-nexus-border rounded px-2 py-1 text-xs font-mono text-nexus-text focus:outline-none focus:border-nexus-accent"
            placeholder="Username"
          />
        </div>
        <div>
          <label class="text-[10px] text-nexus-text-muted uppercase tracking-wider block mb-1">Password</label>
          <input
            type="password"
            :value="requestStore.authConfig.password || ''"
            @input="requestStore.authConfig = { ...requestStore.authConfig, password: ($event.target as HTMLInputElement).value }"
            class="w-full bg-nexus-bg border border-nexus-border rounded px-2 py-1 text-xs font-mono text-nexus-text focus:outline-none focus:border-nexus-accent"
            placeholder="Password"
          />
        </div>
      </div>

      <!-- Bearer Token -->
      <div v-else-if="requestStore.authType === 'bearer'" class="space-y-3 max-w-md">
        <p class="text-[10px] text-nexus-text-muted">Authorization header will be added automatically.</p>
        <div>
          <label class="text-[10px] text-nexus-text-muted uppercase tracking-wider block mb-1">Token</label>
          <textarea
            :value="requestStore.authConfig.token || ''"
            @input="requestStore.authConfig = { ...requestStore.authConfig, token: ($event.target as HTMLInputElement).value }"
            class="w-full bg-nexus-bg border border-nexus-border rounded px-2 py-1 text-xs font-mono text-nexus-text focus:outline-none focus:border-nexus-accent resize-none h-20"
            placeholder="Bearer token"
          />
        </div>
      </div>
    </div>
  </div>
</template>
