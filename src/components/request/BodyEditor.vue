<script setup lang="ts">
import { useRequestStore } from '@/stores/request'

const requestStore = useRequestStore()

const bodyTypes = [
  { value: 'none' as const, label: 'None' },
  { value: 'json' as const, label: 'JSON' },
  { value: 'text' as const, label: 'Text' },
  { value: 'form-urlencoded' as const, label: 'Form URL-Encoded' },
]
</script>

<template>
  <div class="h-full flex flex-col overflow-hidden">
    <!-- Body type selector -->
    <div class="flex items-center gap-1 px-3 py-1.5 border-b border-nexus-border">
      <button
        v-for="bt in bodyTypes"
        :key="bt.value"
        class="px-2 py-0.5 rounded text-[10px] font-medium transition-colors"
        :class="requestStore.bodyType === bt.value
          ? 'bg-nexus-accent/20 text-nexus-accent'
          : 'text-nexus-text-muted hover:text-nexus-text'"
        @click="requestStore.bodyType = bt.value"
      >
        {{ bt.label }}
      </button>
    </div>

    <!-- Body content -->
    <div class="flex-1 overflow-auto">
      <div v-if="requestStore.bodyType === 'none'" class="flex items-center justify-center h-full text-xs text-nexus-text-muted">
        This request does not have a body
      </div>

      <textarea
        v-else-if="requestStore.bodyType === 'json' || requestStore.bodyType === 'text'"
        v-model="requestStore.bodyContent"
        class="w-full h-full bg-transparent text-xs font-mono text-nexus-text p-3 resize-none focus:outline-none"
        :placeholder="requestStore.bodyType === 'json' ? '{\n  \n}' : 'Enter request body...'"
        spellcheck="false"
      />

      <!-- Form URL-encoded uses raw text for Phase 1, KV editor can be added later -->
      <textarea
        v-else-if="requestStore.bodyType === 'form-urlencoded'"
        v-model="requestStore.bodyContent"
        class="w-full h-full bg-transparent text-xs font-mono text-nexus-text p-3 resize-none focus:outline-none"
        placeholder="key1=value1&amp;key2=value2"
        spellcheck="false"
      />
    </div>
  </div>
</template>
