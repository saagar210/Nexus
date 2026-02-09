<script setup lang="ts">
interface Tab {
  id: string
  label: string
  badge?: string
}

defineProps<{
  tabs: Tab[]
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>

<template>
  <div class="flex items-center border-b border-nexus-border">
    <button
      v-for="tab in tabs"
      :key="tab.id"
      class="px-3 py-1.5 text-xs font-medium transition-colors relative"
      :class="modelValue === tab.id
        ? 'text-nexus-text'
        : 'text-nexus-text-muted hover:text-nexus-text'"
      @click="emit('update:modelValue', tab.id)"
    >
      {{ tab.label }}
      <span v-if="tab.badge" class="ml-1 text-[10px] text-nexus-accent">{{ tab.badge }}</span>
      <div
        v-if="modelValue === tab.id"
        class="absolute bottom-0 left-0 right-0 h-0.5 bg-nexus-accent"
      />
    </button>
  </div>
</template>
