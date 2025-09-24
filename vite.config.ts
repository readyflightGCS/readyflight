import { resolve } from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Web-only Vite config; Electron uses electron.vite.config.ts
export default defineConfig({
  root: 'client-frontend',
  define: {
    'import.meta.env.VITE_TARGET': JSON.stringify('web')
  },
  resolve: {
    alias: {
      '@renderer': resolve('client-frontend/src')
    }
  },
  plugins: [react()],
  server: {
    port: 5173
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
})
