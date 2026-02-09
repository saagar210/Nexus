<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRequestStore } from '@/stores/request'
import { useResponseStore } from '@/stores/response'

const requestStore = useRequestStore()
const responseStore = useResponseStore()
const urlInput = ref<HTMLInputElement | null>(null)

const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'] as const

const methodColor = computed(() => {
  const colors: Record<string, string> = {
    GET: 'text-method-get',
    POST: 'text-method-post',
    PUT: 'text-method-put',
    PATCH: 'text-method-patch',
    DELETE: 'text-method-delete',
    HEAD: 'text-method-head',
    OPTIONS: 'text-method-options',
  }
  return colors[requestStore.method] || 'text-nexus-text'
})

const showMethodDropdown = ref(false)

function selectMethod(m: string) {
  requestStore.method = m
  showMethodDropdown.value = false
}

async function executeSend() {
  if (!requestStore.url.trim()) return
  if (responseStore.isLoading) {
    await window.api.invoke('http:cancel')
    return
  }

  responseStore.isLoading = true
  responseStore.error = null

  const httpReq = requestStore.buildHttpRequest()
  const result = await window.api.invoke('http:execute', httpReq)

  if (result.success) {
    responseStore.setFromResponse(result.data)
  } else {
    responseStore.setError(result.error)
  }

  responseStore.isLoading = false
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    e.preventDefault()
    executeSend()
  }
}

function focusUrlInput() {
  urlInput.value?.focus()
  urlInput.value?.select()
}

defineExpose({ focusUrlInput, executeSend })
</script>

<template>
  <div class="flex items-center gap-1 p-2 border-b border-nexus-border">
    <!-- Method Dropdown -->
    <div class="relative">
      <button
        class="flex items-center gap-1 px-3 py-1.5 rounded text-sm font-semibold bg-nexus-bg hover:bg-nexus-border transition-colors min-w-[80px] justify-between"
        :class="methodColor"
        @click="showMethodDropdown = !showMethodDropdown"
      >
        {{ requestStore.method }}
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      <div v-if="showMethodDropdown"
           class="absolute top-full left-0 mt-1 bg-nexus-surface border border-nexus-border rounded shadow-lg z-50 min-w-[100px]">
        <button
          v-for="m in methods"
          :key="m"
          class="block w-full text-left px-3 py-1.5 text-sm font-semibold hover:bg-nexus-border transition-colors"
          :class="{
            'text-method-get': m === 'GET',
            'text-method-post': m === 'POST',
            'text-method-put': m === 'PUT',
            'text-method-patch': m === 'PATCH',
            'text-method-delete': m === 'DELETE',
            'text-method-head': m === 'HEAD',
            'text-method-options': m === 'OPTIONS',
          }"
          @click="selectMethod(m)"
        >
          {{ m }}
        </button>
      </div>
    </div>

    <!-- URL Input -->
    <input
      ref="urlInput"
      v-model="requestStore.url"
      type="text"
      placeholder="Enter URL or paste cURL"
      class="flex-1 bg-nexus-bg border border-nexus-border rounded px-3 py-1.5 text-sm font-mono text-nexus-text placeholder-nexus-text-muted focus:outline-none focus:border-nexus-accent transition-colors"
      @keydown="onKeydown"
    />

    <!-- Send / Cancel Button -->
    <button
      class="px-4 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-1.5"
      :class="responseStore.isLoading
        ? 'bg-nexus-error hover:bg-nexus-error/80 text-white'
        : 'bg-nexus-accent hover:bg-nexus-accent/80 text-white'"
      @click="executeSend"
    >
      <template v-if="responseStore.isLoading">
        Cancel
      </template>
      <template v-else>
        Send
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
      </template>
    </button>
  </div>

  <!-- Click-away to close method dropdown -->
  <div v-if="showMethodDropdown" class="fixed inset-0 z-40" @click="showMethodDropdown = false" />
</template>
