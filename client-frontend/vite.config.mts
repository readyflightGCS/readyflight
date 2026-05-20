import path from 'path'
import { resolve } from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { execSync } from 'child_process'

const gitVersion = process.env.APP_VERSION || execSync('git describe --tags --dirty').toString().trim()
const useReactScan = process.env.REACT_SCAN

// Web-only Vite config; Electron uses electron.vite.config.ts
export default defineConfig({
  define: {
    __GIT_VERSION__: JSON.stringify(gitVersion)
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
        let a = html.replace('%RF_VERSION%', gitVersion)
        if (useReactScan === 'true') {
          a = a.replace(
            '%REACTSCAN%',
            `<script crossOrigin="anonymous" src="//unpkg.com/react-scan/dist/auto.global.js"></script>`
          )
        } else {
          a = a.replace('%REACTSCAN%', ``)
        }
        return a
      }
    }
  ],
  server: {
    port: 5173
  },
  build: {
    outDir: 'dist',
    emptyOutDir: false
  }
})
