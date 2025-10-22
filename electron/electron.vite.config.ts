import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from "path"

export default defineConfig({
  main: {
    build: {
      lib: {
        entry: resolve(__dirname, 'main/index.ts'),
        formats: ['cjs']
      }
    },
    plugins: [externalizeDepsPlugin()]
  },
  preload: {
    build: {
      lib: {
        entry: resolve(__dirname, 'preload/index.ts'),
        formats: ['cjs']
      }
    },
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    root: resolve(__dirname, '../client-frontend'),
    define: {
      'import.meta.env.VITE_TARGET': JSON.stringify('electron')
    },
    build: {
      rollupOptions: {
        input: resolve(__dirname, '../client-frontend/index.html')
      }
    },
    resolve: {
      alias: {
        '@renderer': resolve(__dirname, '../client-frontend/src'),
        "@": path.resolve(__dirname, "../client-frontend/src"),
        "@libs": path.resolve(__dirname, "../libs")
      }
    },
    plugins: [
      react(),
      tailwindcss()
    ]
  }
})

