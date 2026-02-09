<script setup lang="ts">
import SplitPane from '@/components/ui/SplitPane.vue'
</script>

<template>
  <main class="overflow-hidden">
    <SplitPane direction="vertical" :initial-split="50" :min-first="150" :min-second="150" storage-key="nexus:split:main">
      <template #first>
        <div class="h-full flex items-center justify-center text-nexus-text-muted text-sm">
          Request Editor
        </div>
      </template>
      <template #second>
        <div class="h-full flex items-center justify-center text-nexus-text-muted text-sm">
          Response Viewer
        </div>
      </template>
    </SplitPane>
  </main>
</template>
