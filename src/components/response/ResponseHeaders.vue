<script setup lang="ts">
import { ref } from 'vue'
import { useResponseStore } from '@/stores/response'

const responseStore = useResponseStore()
const copiedKey = ref<string | null>(null)

async function copyValue(key: string, value: string) {
  await navigator.clipboard.writeText(value)
  copiedKey.value = key
  setTimeout(() => { copiedKey.value = null }, 1500)
}
</script>

<template>
  <div class="h-full overflow-auto">
    <table class="w-full text-xs">
      <thead>
        <tr class="border-b border-nexus-border text-nexus-text-muted text-left">
          <th class="px-3 py-1.5 font-medium w-1/3">Header</th>
          <th class="px-3 py-1.5 font-medium">Value</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(value, key, index) in responseStore.headers"
          :key="key"
          class="border-b border-nexus-border/50 hover:bg-nexus-border/30 cursor-pointer transition-colors"
          :class="{ 'bg-nexus-bg/50': (index as number) % 2 === 0 }"
          @click="copyValue(String(key), String(value))"
        >
          <td class="px-3 py-1.5 font-mono font-medium text-nexus-accent">{{ key }}</td>
          <td class="px-3 py-1.5 font-mono text-nexus-text">
            <span v-if="copiedKey === key" class="text-nexus-success">Copied!</span>
            <span v-else>{{ value }}</span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
