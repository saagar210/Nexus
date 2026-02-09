<script setup lang="ts">
import { useCollectionStore } from '@/stores/collection'
import type { Collection, SavedRequest } from '@shared/ipc-types'
import CollectionTreeNode from './CollectionTreeNode.vue'

const collectionStore = useCollectionStore()

const emit = defineEmits<{
  'request-selected': [id: string]
}>()
</script>

<template>
  <div class="flex flex-col gap-0.5">
    <CollectionTreeNode
      v-for="node in collectionStore.treeNodes"
      :key="node.type === 'collection' ? (node.data as Collection).id : (node.data as SavedRequest).id"
      :node="node"
      :depth="0"
      @request-selected="(id: string) => emit('request-selected', id)"
    />
  </div>
</template>
