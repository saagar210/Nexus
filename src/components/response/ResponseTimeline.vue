<script setup lang="ts">
import { computed } from 'vue'
import { useResponseStore } from '@/stores/response'

const responseStore = useResponseStore()

const totalTime = computed(() => responseStore.timing?.totalTime ?? 0)
</script>

<template>
  <div class="h-full flex flex-col items-center justify-center p-6">
    <div v-if="responseStore.timing" class="w-full max-w-md">
      <div class="text-center mb-6">
        <span class="text-3xl font-mono font-semibold text-nexus-text">{{ totalTime }}</span>
        <span class="text-sm text-nexus-text-muted ml-1">ms</span>
      </div>

      <!-- Single bar for total time (detailed breakdown added in Phase 5) -->
      <div class="w-full bg-nexus-border rounded-full h-3 overflow-hidden">
        <div class="h-full bg-nexus-accent rounded-full transition-all" style="width: 100%" />
      </div>

      <div class="flex justify-between mt-2 text-[10px] text-nexus-text-muted">
        <span>Total Request Time</span>
        <span>{{ totalTime }} ms</span>
      </div>
    </div>
    <div v-else class="text-sm text-nexus-text-muted">
      No timing data available
    </div>
  </div>
</template>
