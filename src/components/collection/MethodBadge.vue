<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  method: string
}>()

const colorClass = computed(() => {
  const colors: Record<string, string> = {
    GET: 'text-method-get',
    POST: 'text-method-post',
    PUT: 'text-method-put',
    PATCH: 'text-method-patch',
    DELETE: 'text-method-delete',
    HEAD: 'text-method-head',
    OPTIONS: 'text-method-options',
  }
  return colors[props.method] || 'text-nexus-text-muted'
})

const shortMethod = computed(() => {
  if (props.method === 'DELETE') return 'DEL'
  if (props.method === 'OPTIONS') return 'OPT'
  if (props.method === 'PATCH') return 'PAT'
  return props.method
})
</script>

<template>
  <span class="text-[9px] font-bold uppercase tracking-wider min-w-[28px]" :class="colorClass">
    {{ shortMethod }}
  </span>
</template>
