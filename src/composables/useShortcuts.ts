import { onMounted, onBeforeUnmount } from 'vue'

interface Shortcut {
  key: string
  meta: boolean
  shift?: boolean
  handler: () => void
  description: string
}

export function useShortcuts(shortcuts: Shortcut[]): void {
  function onKeydown(e: KeyboardEvent) {
    const meta = e.metaKey || e.ctrlKey

    for (const shortcut of shortcuts) {
      if (
        e.key.toLowerCase() === shortcut.key.toLowerCase() &&
        meta === shortcut.meta &&
        (shortcut.shift ? e.shiftKey : !e.shiftKey)
      ) {
        e.preventDefault()
        shortcut.handler()
        return
      }
    }
  }

  onMounted(() => {
    window.addEventListener('keydown', onKeydown)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('keydown', onKeydown)
  })
}
