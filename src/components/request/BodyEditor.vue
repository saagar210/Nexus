<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRequestStore } from '@/stores/request'
import { useMonaco } from '@/composables/useMonaco'

const requestStore = useRequestStore()

const bodyTypes = [
  { value: 'none' as const, label: 'None' },
  { value: 'json' as const, label: 'JSON' },
  { value: 'text' as const, label: 'Text' },
  { value: 'form-urlencoded' as const, label: 'Form URL-Encoded' },
]

const editorContainer = ref<HTMLElement | null>(null)
const monacoLanguage = computed(() => {
  if (requestStore.bodyType === 'json') return 'json'
  return 'plaintext'
})

const { value: editorValue, setLanguage } = useMonaco(editorContainer, {
  language: monacoLanguage.value,
  value: requestStore.bodyContent,
})

// Sync editor → store
watch(editorValue, (newVal) => {
  requestStore.bodyContent = newVal
})

// Sync store → editor (e.g. when loading a saved request)
watch(() => requestStore.bodyContent, (newVal) => {
  if (editorValue.value !== newVal) {
    editorValue.value = newVal
  }
})

// Update language when body type changes
watch(() => requestStore.bodyType, () => {
  setLanguage(monacoLanguage.value)
})

const showEditor = computed(() =>
  requestStore.bodyType === 'json' || requestStore.bodyType === 'text'
)
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
    <div class="flex-1 overflow-hidden">
      <div v-if="requestStore.bodyType === 'none'" class="flex items-center justify-center h-full text-xs text-nexus-text-muted">
        This request does not have a body
      </div>

      <div v-else-if="showEditor" ref="editorContainer" class="h-full w-full" />

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
