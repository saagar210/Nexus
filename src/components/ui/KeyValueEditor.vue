<script setup lang="ts">
import { computed } from 'vue'

interface KVRow {
  key: string
  value: string
  enabled: boolean
}

const props = withDefaults(defineProps<{
  modelValue: KVRow[]
  keyPlaceholder?: string
  valuePlaceholder?: string
  keyAutoComplete?: string[]
}>(), {
  keyPlaceholder: 'Key',
  valuePlaceholder: 'Value',
  keyAutoComplete: () => [],
})

const emit = defineEmits<{
  'update:modelValue': [value: KVRow[]]
}>()

const rows = computed(() => [
  ...props.modelValue,
  { key: '', value: '', enabled: true }, // ghost row
])

function updateRow(index: number, field: keyof KVRow, value: string | boolean) {
  const current = [...props.modelValue]

  if (index >= current.length) {
    // Typing in ghost row — create a new real row
    const newRow: KVRow = { key: '', value: '', enabled: true }
    if (field === 'key') newRow.key = value as string
    else if (field === 'value') newRow.value = value as string
    current.push(newRow)
  } else {
    current[index] = { ...current[index], [field]: value }
  }

  emit('update:modelValue', current)
}

function deleteRow(index: number) {
  const current = [...props.modelValue]
  current.splice(index, 1)
  emit('update:modelValue', current)
}
</script>

<template>
  <div class="overflow-auto">
    <div
      v-for="(row, index) in rows"
      :key="index"
      class="flex items-center gap-1 px-2 py-0.5 group"
      :class="{ 'opacity-40': !row.enabled && index < modelValue.length }"
    >
      <!-- Checkbox -->
      <input
        v-if="index < modelValue.length"
        type="checkbox"
        :checked="row.enabled"
        class="w-3 h-3 rounded border-nexus-border bg-nexus-bg accent-nexus-accent flex-shrink-0"
        @change="updateRow(index, 'enabled', !row.enabled)"
      />
      <div v-else class="w-3 flex-shrink-0" />

      <!-- Key -->
      <input
        type="text"
        :value="row.key"
        :placeholder="index >= modelValue.length ? keyPlaceholder : ''"
        :list="keyAutoComplete.length > 0 ? `kv-autocomplete-${index}` : undefined"
        class="flex-1 bg-transparent border-none text-xs font-mono text-nexus-text placeholder-nexus-text-muted/40 focus:outline-none px-1 py-0.5"
        @input="updateRow(index, 'key', ($event.target as HTMLInputElement).value)"
      />
      <datalist v-if="keyAutoComplete.length > 0" :id="`kv-autocomplete-${index}`">
        <option v-for="opt in keyAutoComplete" :key="opt" :value="opt" />
      </datalist>

      <!-- Value -->
      <input
        type="text"
        :value="row.value"
        :placeholder="index >= modelValue.length ? valuePlaceholder : ''"
        class="flex-1 bg-transparent border-none text-xs font-mono text-nexus-text placeholder-nexus-text-muted/40 focus:outline-none px-1 py-0.5"
        @input="updateRow(index, 'value', ($event.target as HTMLInputElement).value)"
      />

      <!-- Delete -->
      <button
        v-if="index < modelValue.length"
        class="p-0.5 rounded text-nexus-text-muted hover:text-nexus-error opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
        @click="deleteRow(index)"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
      <div v-else class="w-4 flex-shrink-0" />
    </div>
  </div>
</template>
