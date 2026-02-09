<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'

const props = withDefaults(defineProps<{
  direction?: 'horizontal' | 'vertical'
  initialSplit?: number
  minFirst?: number
  minSecond?: number
  storageKey?: string
}>(), {
  direction: 'vertical',
  initialSplit: 50,
  minFirst: 200,
  minSecond: 200,
  storageKey: 'nexus:split:main',
})

const containerRef = ref<HTMLElement | null>(null)
const splitPercent = ref(props.initialSplit)
const isDragging = ref(false)

onMounted(() => {
  const saved = localStorage.getItem(props.storageKey)
  if (saved) {
    const parsed = parseFloat(saved)
    if (!isNaN(parsed) && parsed > 0 && parsed < 100) {
      splitPercent.value = parsed
    }
  }
})

function saveSplit() {
  localStorage.setItem(props.storageKey, String(splitPercent.value))
}

function onPointerDown(e: PointerEvent) {
  isDragging.value = true
  const target = e.currentTarget as HTMLElement
  target.setPointerCapture(e.pointerId)
  document.body.style.cursor = props.direction === 'vertical' ? 'row-resize' : 'col-resize'
  document.body.style.userSelect = 'none'
}

function onPointerMove(e: PointerEvent) {
  if (!isDragging.value || !containerRef.value) return

  const rect = containerRef.value.getBoundingClientRect()

  if (props.direction === 'vertical') {
    const totalHeight = rect.height
    const y = e.clientY - rect.top
    const clampedY = Math.max(props.minFirst, Math.min(y, totalHeight - props.minSecond))
    splitPercent.value = (clampedY / totalHeight) * 100
  } else {
    const totalWidth = rect.width
    const x = e.clientX - rect.left
    const clampedX = Math.max(props.minFirst, Math.min(x, totalWidth - props.minSecond))
    splitPercent.value = (clampedX / totalWidth) * 100
  }
}

function onPointerUp() {
  isDragging.value = false
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
  saveSplit()
}

function onDoubleClick() {
  splitPercent.value = props.initialSplit
  saveSplit()
}

const isVertical = computed(() => props.direction === 'vertical')

const firstStyle = computed(() => {
  return isVertical.value
    ? { height: `${splitPercent.value}%` }
    : { width: `${splitPercent.value}%` }
})

const secondStyle = computed(() => {
  return isVertical.value
    ? { height: `${100 - splitPercent.value}%` }
    : { width: `${100 - splitPercent.value}%` }
})
</script>

<template>
  <div ref="containerRef"
       class="flex overflow-hidden"
       :class="isVertical ? 'flex-col' : 'flex-row'">
    <div class="overflow-hidden" :style="firstStyle">
      <slot name="first" />
    </div>
    <div class="flex-shrink-0 bg-nexus-border hover:bg-nexus-accent/50 transition-colors"
         :class="[
           isVertical ? 'h-1 cursor-row-resize' : 'w-1 cursor-col-resize',
           isDragging ? 'bg-nexus-accent/50' : '',
         ]"
         @pointerdown="onPointerDown"
         @pointermove="onPointerMove"
         @pointerup="onPointerUp"
         @lostpointercapture="onPointerUp"
         @dblclick="onDoubleClick" />
    <div class="overflow-hidden" :style="secondStyle">
      <slot name="second" />
    </div>
  </div>
</template>
