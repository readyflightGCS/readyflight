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
    resolve: {
      alias: {
        '@libs': path.resolve(__dirname, '../libs/src'),
      }
    }
  },
  preload: {
    build: {
      lib: {
        entry: resolve(__dirname, 'preload/index.ts'),
        formats: ['cjs']
      }
    },
    resolve: {
      alias: {
        '@libs': path.resolve(__dirname, '../libs/src'),
      }
    }
  },
  renderer: {
    root: resolve(__dirname, '../client-frontend'),
    build: {
      rollupOptions: {
        input: resolve(__dirname, '../client-frontend/index.html')
      }
    },
    resolve: {
      alias: {
        '@renderer': resolve(__dirname, '../client-frontend/src'),
        "@": path.resolve(__dirname, "../client-frontend/src"),
        "@libs": path.resolve(__dirname, "../libs/src"),
        "@ifrunistuttgart/node-mavlink": path.resolve(__dirname, "../libs/src/mavlink-browser-shim.ts")
      }
    },
    plugins: [
      react(),
      tailwindcss()
    ]
  }
})

