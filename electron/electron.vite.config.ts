import { resolve } from 'path'
import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { execSync } from 'child_process'

const gitVersion =
  process.env.APP_VERSION || execSync('git describe --tags --dirty').toString().trim()

export default defineConfig({
  main: {
    build: {
      lib: {
        entry: resolve(__dirname, 'main/index.ts'),
        formats: ['cjs']
      },
      rollupOptions: {
        // Keep native modules out of the bundle so Electron can load their .node binaries
        external: ['serialport', '@serialport/bindings-cpp']
      }
    },
    resolve: {
      alias: {
        '@libs': path.resolve(__dirname, '../libs/src'),
        '@/electron': path.resolve(__dirname, './main')
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
        '@/electron': path.resolve(__dirname, './main')
      }
    }
  },
  renderer: {
    define: {
      __GIT_VERSION__: JSON.stringify(gitVersion)
    },
    root: resolve(__dirname, '../client-frontend'),
    build: {
      rollupOptions: {
        input: resolve(__dirname, '../client-frontend/index.html')
      }
    },
    resolve: {
      alias: {
        '@renderer': resolve(__dirname, '../client-frontend/src'),
        '@': path.resolve(__dirname, '../client-frontend/src'),
        '@libs': path.resolve(__dirname, '../libs/src'),
        '@/electron': path.resolve(__dirname, './main'),
        '@ifrunistuttgart/node-mavlink': path.resolve(
          __dirname,
          '../libs/src/mavlink-browser-shim.ts'
        )
      }
    },
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'html-transform',
        transformIndexHtml(html) {
          return html.replace('%RF_VERSION%', gitVersion)
        }
      }
    ]
  }
})
