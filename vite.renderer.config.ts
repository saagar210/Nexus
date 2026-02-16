import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import monacoEditorPlugin from 'vite-plugin-monaco-editor'
import path from 'node:path'

const monacoPlugin = (monacoEditorPlugin as unknown as { default: typeof monacoEditorPlugin }).default || monacoEditorPlugin

export default defineConfig({
  cacheDir: process.env.VITE_CACHE_DIR ? path.join(process.env.VITE_CACHE_DIR, 'renderer') : undefined,
  plugins: [
    vue(),
    monacoPlugin({
      languageWorkers: ['editorWorkerService', 'json', 'css', 'html', 'typescript'],
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@shared': path.resolve(__dirname, 'shared'),
    },
  },
})
