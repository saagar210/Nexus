import { ref, watch, onBeforeUnmount, type Ref } from 'vue'
import * as monaco from 'monaco-editor'

interface UseMonacoOptions {
  language: string
  readOnly?: boolean
  value?: string
  minimap?: boolean
  wordWrap?: 'on' | 'off'
}

export function useMonaco(
  containerRef: Ref<HTMLElement | null>,
  options: UseMonacoOptions
) {
  const value = ref(options.value ?? '')
  const editorInstance = ref<monaco.editor.IStandaloneCodeEditor | null>(null)
  let isUpdatingFromEditor = false
  let isUpdatingFromValue = false
  let resizeObserver: ResizeObserver | null = null

  function createEditor(container: HTMLElement) {
    const editor = monaco.editor.create(container, {
      value: value.value,
      language: options.language,
      theme: 'nexus-dark',
      readOnly: options.readOnly ?? false,
      minimap: { enabled: options.minimap ?? false },
      wordWrap: options.wordWrap ?? 'on',
      fontSize: 12,
      lineNumbers: options.readOnly ? 'off' : 'on',
      scrollBeyondLastLine: false,
      automaticLayout: false,
      tabSize: 2,
      renderLineHighlight: options.readOnly ? 'none' : 'line',
      overviewRulerLanes: 0,
      hideCursorInOverviewRuler: true,
      overviewRulerBorder: false,
      scrollbar: {
        verticalScrollbarSize: 8,
        horizontalScrollbarSize: 8,
      },
      padding: { top: 8, bottom: 8 },
      contextmenu: false,
    })

    editor.onDidChangeModelContent(() => {
      if (isUpdatingFromValue) return
      isUpdatingFromEditor = true
      value.value = editor.getValue()
      isUpdatingFromEditor = false
    })

    // Resize observer
    resizeObserver = new ResizeObserver(() => {
      editor.layout()
    })
    resizeObserver.observe(container)

    editorInstance.value = editor
  }

  // Watch container ref for mounting
  const stopWatchContainer = watch(containerRef, (container) => {
    if (container && !editorInstance.value) {
      createEditor(container)
    }
  }, { immediate: true })

  // Sync value → editor
  watch(value, (newVal) => {
    if (isUpdatingFromEditor) return
    if (editorInstance.value) {
      isUpdatingFromValue = true
      const model = editorInstance.value.getModel()
      if (model && model.getValue() !== newVal) {
        model.setValue(newVal)
      }
      isUpdatingFromValue = false
    }
  })

  function setLanguage(lang: string) {
    if (editorInstance.value) {
      const model = editorInstance.value.getModel()
      if (model) {
        monaco.editor.setModelLanguage(model, lang)
      }
    }
  }

  function formatDocument() {
    if (editorInstance.value) {
      editorInstance.value.getAction('editor.action.formatDocument')?.run()
    }
  }

  onBeforeUnmount(() => {
    stopWatchContainer()
    resizeObserver?.disconnect()
    editorInstance.value?.dispose()
    editorInstance.value = null
  })

  return { value, editor: editorInstance, setLanguage, formatDocument }
}
