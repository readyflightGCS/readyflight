import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type { Connection, ConnectionStatus, ConnectionStats } from '@libs/connection/types'

type DataPayload = { connectionId: string; payload: number[] }
type StatusPayload = { connectionId: string; status: ConnectionStatus } & ConnectionStats
type Unsubscribe = () => void

const connectionAPI = {
  connect: (config: ITransportConfig) =>
    ipcRenderer.send('telemetry:command:connect', config),

  disconnect: (id: string) =>
    ipcRenderer.send('telemetry:command:disconnect', id),

  send: (connectionId: string, payload: number[]) =>
    ipcRenderer.send('telemetry:command:send', { connectionId, payload }),

  list: () => {
    ipcRenderer.send('telemetry:command:list')
  },

  onData: (handler: (data: DataPayload) => void): Unsubscribe => {
    const listener = (_: Electron.IpcRendererEvent, data: DataPayload) => handler(data)
    ipcRenderer.on('telemetry:message:data', listener)
    return () => ipcRenderer.removeListener('telemetry:message:data', listener)
  },

  onStatus: (handler: (data: StatusPayload) => void): Unsubscribe => {
    const listener = (_: Electron.IpcRendererEvent, data: StatusPayload) => handler(data)
    ipcRenderer.on('telemetry:message:status', listener)
    return () => ipcRenderer.removeListener('telemetry:message:status', listener)
  },

  onAvailableConnections: (handler: (connections: Connection[]) => void): Unsubscribe => {
    const listener = (_: Electron.IpcRendererEvent, connections: Connection[]) => handler(connections)
    ipcRenderer.on('telemetry:message:availableConnections', listener)
    return () => ipcRenderer.removeListener('telemetry:message:availableConnections', listener)
  },
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
