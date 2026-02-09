<script setup lang="ts">
import SplitPane from '@/components/ui/SplitPane.vue'
import UrlBar from '@/components/request/UrlBar.vue'
import ResponseViewer from '@/components/response/ResponseViewer.vue'
</script>

<template>
  <main class="overflow-hidden flex flex-col">
    <UrlBar />
    <SplitPane class="flex-1" direction="vertical" :initial-split="50" :min-first="150" :min-second="150" storage-key="nexus:split:main">
      <template #first>
        <div class="h-full flex items-center justify-center text-nexus-text-muted text-sm">
          Request Editor
        </div>
      </template>
      <template #second>
        <ResponseViewer />
      </template>
    </SplitPane>
  </main>
</template>
