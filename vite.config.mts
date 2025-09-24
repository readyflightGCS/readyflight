import path from "path"
import { resolve } from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Web-only Vite config; Electron uses electron.vite.config.ts
export default defineConfig({
  root: 'client-frontend',
  define: {
    'import.meta.env.VITE_TARGET': JSON.stringify('web')
  },
  resolve: {
    alias: {
      '@renderer': resolve('client-frontend/src'),
      "@": path.resolve(__dirname, "./client-frontend/src")
    }
  },
  plugins: [
    react(),
    tailwindcss()
  ],
  server: {
    port: 5173
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
})
