import { defineConfig } from 'vite'
import path from 'node:path'

export default defineConfig({
  cacheDir: process.env.VITE_CACHE_DIR ? path.join(process.env.VITE_CACHE_DIR, 'preload') : undefined,
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, 'shared'),
    },
  },
})
