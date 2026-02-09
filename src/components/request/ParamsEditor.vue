<script setup lang="ts">
import { watch, ref, nextTick } from 'vue'
import { useRequestStore } from '@/stores/request'
import KeyValueEditor from '@/components/ui/KeyValueEditor.vue'

const requestStore = useRequestStore()
const syncSource = ref<'url' | 'params' | null>(null)

watch(() => requestStore.url, (newUrl) => {
  if (syncSource.value === 'params') return
  syncSource.value = 'url'

  try {
    const urlObj = new URL(newUrl)
    const params: Array<{ key: string; value: string; enabled: boolean }> = []
    urlObj.searchParams.forEach((value, key) => {
      params.push({ key, value, enabled: true })
    })
    // Preserve disabled params from current state
    const disabled = requestStore.queryParams.filter(p => !p.enabled)
    requestStore.queryParams = [...params, ...disabled]
  } catch {
    // URL is malformed, don't sync
  }

  nextTick(() => { syncSource.value = null })
})

watch(() => requestStore.queryParams, (newParams) => {
  if (syncSource.value === 'url') return
  syncSource.value = 'params'

  try {
    const urlObj = new URL(requestStore.url)
    // Clear existing params
    const keys = Array.from(urlObj.searchParams.keys())
    for (const key of keys) {
      urlObj.searchParams.delete(key)
    }
    // Add enabled params
    for (const p of newParams) {
      if (p.enabled && p.key.trim()) {
        urlObj.searchParams.set(p.key, p.value)
      }
    }
    requestStore.url = urlObj.toString()
  } catch {
    // URL is malformed, don't sync
  }

  nextTick(() => { syncSource.value = null })
}, { deep: true })
</script>

<template>
  <KeyValueEditor
    :model-value="requestStore.queryParams"
    @update:model-value="requestStore.queryParams = $event"
    key-placeholder="Parameter"
    value-placeholder="Value"
  />
</template>
