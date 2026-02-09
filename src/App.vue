<script setup lang="ts">
import { ref, onMounted } from 'vue'
import TopBar from '@/components/layout/TopBar.vue'
import Sidebar from '@/components/layout/Sidebar.vue'
import StatusBar from '@/components/layout/StatusBar.vue'
import WorkspaceView from '@/views/WorkspaceView.vue'
import SaveDialog from '@/components/ui/SaveDialog.vue'
import { useWorkspaceStore } from '@/stores/workspace'
import { useCollectionStore } from '@/stores/collection'
import { useRequestStore } from '@/stores/request'
import { useResponseStore } from '@/stores/response'
import { useShortcuts } from '@/composables/useShortcuts'

const workspaceStore = useWorkspaceStore()
const collectionStore = useCollectionStore()
const requestStore = useRequestStore()
const responseStore = useResponseStore()

const showSaveDialog = ref(false)
const workspaceViewRef = ref<InstanceType<typeof WorkspaceView> | null>(null)

useShortcuts([
  {
    key: 'Enter',
    meta: true,
    handler: () => workspaceViewRef.value?.executeSend(),
    description: 'Send request',
  },
  {
    key: 's',
    meta: true,
    handler: () => handleSave(),
    description: 'Save request',
  },
  {
    key: 'n',
    meta: true,
    handler: () => handleNewRequest(),
    description: 'New request',
  },
  {
    key: 'l',
    meta: true,
    handler: () => workspaceViewRef.value?.focusUrlInput(),
    description: 'Focus URL input',
  },
  {
    key: 'Escape',
    meta: false,
    handler: () => {
      if (responseStore.isLoading) {
        window.api.invoke('http:cancel')
      }
    },
    description: 'Cancel in-flight request',
  },
])

onMounted(async () => {
  await workspaceStore.loadDefault()
  if (workspaceStore.currentWorkspace) {
    await collectionStore.fetchAll(workspaceStore.currentWorkspace.id)
  }
})

function handleNewRequest() {
  requestStore.reset()
  responseStore.reset()
}

async function handleSave() {
  if (!workspaceStore.currentWorkspace) return

  if (requestStore.currentRequestId) {
    // Update existing
    const saved = await collectionStore.saveRequest(workspaceStore.currentWorkspace.id, {
      id: requestStore.currentRequestId,
      name: requestStore.currentRequestName || 'Untitled Request',
      method: requestStore.method,
      url: requestStore.url,
      headers: requestStore.headers,
      queryParams: requestStore.queryParams,
      bodyType: requestStore.bodyType,
      bodyContent: requestStore.bodyContent,
      authType: requestStore.authType,
      authConfig: requestStore.authConfig,
    })
    if (saved) {
      requestStore.isDirty = false
    }
  } else {
    // New request — prompt for name
    showSaveDialog.value = true
  }
}

async function handleSaveWithName(name: string) {
  showSaveDialog.value = false
  if (!workspaceStore.currentWorkspace) return

  const saved = await collectionStore.saveRequest(workspaceStore.currentWorkspace.id, {
    name,
    method: requestStore.method,
    url: requestStore.url,
    headers: requestStore.headers,
    queryParams: requestStore.queryParams,
    bodyType: requestStore.bodyType,
    bodyContent: requestStore.bodyContent,
    authType: requestStore.authType,
    authConfig: requestStore.authConfig,
  })

  if (saved) {
    requestStore.currentRequestId = saved.id
    requestStore.currentRequestName = saved.name
    requestStore.isDirty = false
  }
}

// Save history after each request execution
async function saveHistory() {
  if (!workspaceStore.currentWorkspace) return

  await window.api.invoke('db:history:save', {
    requestId: requestStore.currentRequestId,
    workspaceId: workspaceStore.currentWorkspace.id,
    method: requestStore.method,
    url: requestStore.url,
    requestHeaders: JSON.stringify(requestStore.headers),
    requestBody: requestStore.bodyContent || null,
    statusCode: responseStore.statusCode,
    responseHeaders: responseStore.statusCode ? JSON.stringify(responseStore.headers) : null,
    responseBody: responseStore.body || null,
    responseSizeBytes: responseStore.size || null,
    responseTimeMs: responseStore.timing?.totalTime ?? null,
    errorMessage: responseStore.error,
  })
}

</script>

<template>
  <div class="h-screen grid grid-rows-[40px_1fr_24px] grid-cols-[280px_1fr]">
    <TopBar class="col-span-2" />
    <Sidebar @new-request="handleNewRequest" />
    <WorkspaceView ref="workspaceViewRef" @request-sent="saveHistory" />
    <StatusBar class="col-span-2" />
  </div>

  <SaveDialog
    :open="showSaveDialog"
    @save="handleSaveWithName"
    @cancel="showSaveDialog = false"
  />
</template>
