<script setup lang="ts">
import { useRequestStore } from '@/stores/request'
import KeyValueEditor from '@/components/ui/KeyValueEditor.vue'

const requestStore = useRequestStore()

const commonHeaders = [
  'Accept', 'Authorization', 'Cache-Control', 'Content-Type',
  'Cookie', 'Origin', 'Referer', 'User-Agent', 'X-Requested-With',
]
</script>

<template>
  <KeyValueEditor
    :model-value="requestStore.headers"
    @update:model-value="requestStore.headers = $event"
    key-placeholder="Header"
    value-placeholder="Value"
    :key-auto-complete="commonHeaders"
  />
</template>
