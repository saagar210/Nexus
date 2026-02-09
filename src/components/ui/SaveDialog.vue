<script setup lang="ts">
import { ref, onMounted } from 'vue'

defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  'save': [name: string]
  'cancel': []
}>()

const name = ref('')
const inputRef = ref<HTMLInputElement | null>(null)

onMounted(() => {
  setTimeout(() => inputRef.value?.focus(), 50)
})

function handleSave() {
  if (name.value.trim()) {
    emit('save', name.value.trim())
  }
}
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/50" @click="emit('cancel')" />
      <div class="relative bg-nexus-surface border border-nexus-border rounded-lg shadow-xl p-4 w-80">
        <h3 class="text-sm font-medium text-nexus-text mb-3">Save Request</h3>
        <input
          ref="inputRef"
          v-model="name"
          type="text"
          placeholder="Request name"
          class="w-full bg-nexus-bg border border-nexus-border rounded px-3 py-1.5 text-sm text-nexus-text placeholder-nexus-text-muted focus:outline-none focus:border-nexus-accent"
          @keydown.enter="handleSave"
          @keydown.escape="emit('cancel')"
        />
        <div class="flex justify-end gap-2 mt-3">
          <button
            class="px-3 py-1 rounded text-xs text-nexus-text-muted hover:text-nexus-text transition-colors"
            @click="emit('cancel')"
          >
            Cancel
          </button>
          <button
            class="px-3 py-1 rounded text-xs bg-nexus-accent text-white hover:bg-nexus-accent/80 transition-colors"
            @click="handleSave"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
