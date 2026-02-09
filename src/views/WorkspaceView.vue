<script setup lang="ts">
import SplitPane from '@/components/ui/SplitPane.vue'
import UrlBar from '@/components/request/UrlBar.vue'
import RequestEditor from '@/components/request/RequestEditor.vue'
import ResponseViewer from '@/components/response/ResponseViewer.vue'

const emit = defineEmits<{
  'request-sent': []
}>()
</script>

<template>
  <main class="overflow-hidden flex flex-col">
    <UrlBar @request-sent="emit('request-sent')" />
    <SplitPane class="flex-1" direction="vertical" :initial-split="50" :min-first="150" :min-second="150" storage-key="nexus:split:main">
      <template #first>
        <RequestEditor />
      </template>
      <template #second>
        <ResponseViewer />
      </template>
    </SplitPane>
  </main>
</template>
