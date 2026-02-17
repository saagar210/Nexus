import { defineConfig } from 'vite'
import path from 'node:path'

export default defineConfig({
  cacheDir: process.env.VITE_CACHE_DIR ? path.join(process.env.VITE_CACHE_DIR, 'main') : undefined,
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, 'shared'),
    },
    conditions: ['node'],
    mainFields: ['module', 'jsnext:main', 'jsnext'],
  },
  build: {
    rollupOptions: {
      external: ['better-sqlite3', 'undici'],
    },
  },
})
