import path from 'path'
import { resolve } from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { execSync } from 'child_process'

const gitVersion = execSync('git describe --tags --dirty')
  .toString()
  .trim()

// Web-only Vite config; Electron uses electron.vite.config.ts
export default defineConfig({
  define: {
    __GIT_VERSION__: JSON.stringify(gitVersion),
  },
  root: '.',
  resolve: {
    alias: {
      '@renderer': resolve('src'),
      '@': path.resolve(__dirname, './src'),
      '@libs': path.resolve(__dirname, '../libs/src'),
      '@ifrunistuttgart/node-mavlink': path.resolve(
        __dirname,
        '../libs/src/mavlink-browser-shim.ts'
      )
    }
  },
  plugins: [
    react({
      babel: {
        plugins: ['babel-plugin-react-compiler']
      }
    }),
    tailwindcss(),
    {
      name: 'html-transform',
      transformIndexHtml(html) {
        return html.replace(
          '%RF_VERSION%',
          gitVersion
        )
      },
    },
  ],
  server: {
    port: 5173
  },
  build: {
    outDir: 'dist',
    emptyOutDir: false
  }
})
