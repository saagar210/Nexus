<script setup lang="ts">
import type { DiscoveryProgress } from '@shared/ipc-types'

defineProps<{
  progress: DiscoveryProgress
}>()

const steps = ['probing', 'parsing', 'extracting', 'saving', 'complete'] as const

function stepIndex(step: string): number {
  return steps.indexOf(step as typeof steps[number])
}
</script>

<template>
  <div class="flex flex-col gap-2 py-2">
    <div class="flex items-center gap-2">
      <div
        v-for="(step, i) in steps"
        :key="step"
        class="flex items-center gap-1"
      >
        <div
          class="w-2 h-2 rounded-full transition-colors"
          :class="{
            'bg-nexus-accent': stepIndex(progress.step) >= i,
            'bg-nexus-border': stepIndex(progress.step) < i,
            'animate-pulse': progress.step === step && step !== 'complete',
          }"
        />
        <span
          v-if="i < steps.length - 1"
          class="text-[9px] text-nexus-text-muted capitalize"
        >{{ step }}</span>
        <span v-else class="text-[9px] text-nexus-success capitalize">{{ step }}</span>
      </div>
    </div>
    <p class="text-xs text-nexus-text-muted">{{ progress.message }}</p>
    <!-- Progress bar -->
    <div class="w-full h-1 bg-nexus-border rounded overflow-hidden">
      <div
        class="h-full bg-nexus-accent transition-all duration-300"
        :style="{ width: `${progress.progress}%` }"
      />
    </div>
  </div>
</template>
