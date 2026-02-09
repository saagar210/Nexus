<script setup lang="ts">
import TopBar from '@/components/layout/TopBar.vue'
import Sidebar from '@/components/layout/Sidebar.vue'
import StatusBar from '@/components/layout/StatusBar.vue'
import WorkspaceView from '@/views/WorkspaceView.vue'
</script>

<template>
  <div class="h-screen grid grid-rows-[40px_1fr_24px] grid-cols-[280px_1fr]">
    <TopBar class="col-span-2" />
    <Sidebar />
    <WorkspaceView />
    <StatusBar class="col-span-2" />
  </div>
</template>
