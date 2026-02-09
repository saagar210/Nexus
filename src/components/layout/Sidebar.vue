<script setup lang="ts">
</script>

<template>
  <aside class="flex flex-col bg-nexus-surface border-r border-nexus-border overflow-hidden">
    <div class="flex items-center justify-between px-3 py-2 border-b border-nexus-border">
      <span class="text-xs font-medium text-nexus-text-muted uppercase tracking-wider">Requests</span>
      <button class="p-1 rounded hover:bg-nexus-border text-nexus-text-muted hover:text-nexus-text transition-colors"
              title="New Request">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
    </div>
    <div class="flex-1 overflow-y-auto p-2">
      <div class="flex flex-col items-center justify-center h-full text-nexus-text-muted text-xs text-center px-4">
        <p>No saved requests yet.</p>
        <p class="mt-1 text-[11px]">Send a request and save it with Cmd+S</p>
      </div>
    </div>
  </aside>
</template>
