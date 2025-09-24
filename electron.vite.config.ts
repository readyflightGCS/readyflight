import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  main: {
    build: {
      lib: {
        entry: 'electron/main/index.ts',
        formats: ['cjs']
      }
    },
    plugins: [externalizeDepsPlugin()]
  },
  preload: {
    build: {
      lib: {
        entry: 'electron/preload/index.ts',
        formats: ['cjs']
      }
    },
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    root: 'client-frontend',
    define: {
      'import.meta.env.VITE_TARGET': JSON.stringify('electron')
    },
    build: {
      rollupOptions: {
        input: resolve('client-frontend/index.html')
      }
    },
    resolve: {
      alias: {
        '@renderer': resolve('client-frontend/src')
      }
    },
    plugins: [
      react(),
      tailwindcss()
    ]
  }
})
