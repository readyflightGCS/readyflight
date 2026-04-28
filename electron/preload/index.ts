import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type { ConnectionMessage, ConnectionCommand } from '@libs/connection/types'

type Unsubscribe = () => void

const connectionAPI = {
  sendCommand: (msg: ConnectionCommand) => {
    ipcRenderer.send('telemetry:command:msg', msg)
  },

  onMessage: (handler: (cmd: ConnectionMessage) => void): Unsubscribe => {
    const listener = (_: Electron.IpcRendererEvent, cmd: ConnectionMessage): void => handler(cmd)
    ipcRenderer.on('telemetry:message:msg', listener)
    return () => ipcRenderer.removeListener('telemetry:message:msg', listener)
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', { connection: connectionAPI })
    contextBridge.exposeInMainWorld('env', { isElectron: true })
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = { connection: connectionAPI }
  // @ts-ignore (define in dts)
  window.env = { isElectron: true }
}
