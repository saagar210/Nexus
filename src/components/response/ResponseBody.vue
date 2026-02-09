<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useResponseStore } from '@/stores/response'
import { useMonaco } from '@/composables/useMonaco'

const responseStore = useResponseStore()
const wordWrap = ref(true)
const copied = ref(false)
const editorContainer = ref<HTMLElement | null>(null)

const contentType = computed(() => {
  const ct = responseStore.headers['content-type'] || ''
  if (ct.includes('json')) return 'json'
  if (ct.includes('html')) return 'html'
  if (ct.includes('xml')) return 'xml'
  if (ct.includes('css')) return 'css'
  return 'plaintext'
})

const formattedBody = computed(() => {
  if (contentType.value === 'json') {
    try {
      return JSON.stringify(JSON.parse(responseStore.body), null, 2)
    } catch {
      return responseStore.body
    }
  }
  return responseStore.body
})

const { value: editorValue, setLanguage, editor } = useMonaco(editorContainer, {
  language: contentType.value,
  readOnly: true,
  value: formattedBody.value,
  minimap: false,
  wordWrap: wordWrap.value ? 'on' : 'off',
})

// Update editor when response changes
watch(formattedBody, (newVal) => {
  editorValue.value = newVal
  setLanguage(contentType.value)
})

// Toggle word wrap
watch(wordWrap, (wrap) => {
  editor.value?.updateOptions({ wordWrap: wrap ? 'on' : 'off' })
})

async function copyBody() {
  await navigator.clipboard.writeText(responseStore.body)
  copied.value = true
  setTimeout(() => { copied.value = false }, 1500)
}
</script>

<template>
  <div class="h-full flex flex-col overflow-hidden">
    <!-- Header -->
    <div class="flex items-center justify-between px-3 py-1 border-b border-nexus-border">
      <span class="text-[10px] text-nexus-text-muted uppercase tracking-wider">{{ contentType }}</span>
      <div class="flex items-center gap-2">
        <button
          class="text-[10px] px-1.5 py-0.5 rounded transition-colors"
          :class="wordWrap ? 'bg-nexus-accent/20 text-nexus-accent' : 'text-nexus-text-muted hover:text-nexus-text'"
          @click="wordWrap = !wordWrap"
        >
          Wrap
        </button>
        <button
          class="text-[10px] px-1.5 py-0.5 rounded text-nexus-text-muted hover:text-nexus-text transition-colors"
          @click="copyBody"
        >
          {{ copied ? 'Copied!' : 'Copy' }}
        </button>
      </div>
    </div>

    <!-- Monaco Editor (read-only) -->
    <div ref="editorContainer" class="flex-1" />
  </div>
</template>
