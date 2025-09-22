import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  root: 'src/renderer',   // where your React app lives
  resolve: {
    alias: {
      '@renderer': resolve('src/renderer/src')
    }
  },
  plugins: [react()],
  server: {
    port: 5173
  },
  build: {
    outDir: 'dist',        // Vercel expects this
    emptyOutDir: true
  }
})

