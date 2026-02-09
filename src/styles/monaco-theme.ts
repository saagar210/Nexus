import * as monaco from 'monaco-editor'

export function registerNexusTheme(): void {
  monaco.editor.defineTheme('nexus-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [],
    colors: {
      'editor.background': '#18181b',
      'editor.foreground': '#fafafa',
      'editorLineNumber.foreground': '#52525b',
      'editor.selectionBackground': '#3b82f633',
      'editor.lineHighlightBackground': '#27272a',
      'editorWidget.background': '#18181b',
      'editorWidget.border': '#27272a',
      'input.background': '#09090b',
      'input.border': '#27272a',
    },
  })
}
