import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type { ConnectionConfig, Connection, ConnectionStatus, ConnectionStats } from '@libs/connection/types'

type DataPayload = { connectionId: string; payload: number[] }
type StatusPayload = { connectionId: string; status: ConnectionStatus } & ConnectionStats
type Unsubscribe = () => void

const connectionAPI = {
  add: (config: ConnectionConfig) =>
    ipcRenderer.send('telemetry:connection:add', config),

  remove: (id: string) =>
    ipcRenderer.send('telemetry:connection:remove', id),

  send: (connectionId: string, payload: number[]) =>
    ipcRenderer.send('telemetry:connection:send', { connectionId, payload }),

  list: () =>
    ipcRenderer.send('telemetry:connection:list'),

  listPorts: (): Promise<string[]> =>
    ipcRenderer.invoke('telemetry:connection:list-ports'),

  onData: (handler: (data: DataPayload) => void): Unsubscribe => {
    const listener = (_: Electron.IpcRendererEvent, data: DataPayload) => handler(data)
    ipcRenderer.on('telemetry:connection:data', listener)
    return () => ipcRenderer.removeListener('telemetry:connection:data', listener)
  },

  onStatus: (handler: (data: StatusPayload) => void): Unsubscribe => {
    const listener = (_: Electron.IpcRendererEvent, data: StatusPayload) => handler(data)
    ipcRenderer.on('telemetry:connection:status', listener)
    return () => ipcRenderer.removeListener('telemetry:connection:status', listener)
  },

  onConnections: (handler: (connections: Connection[]) => void): Unsubscribe => {
    const listener = (_: Electron.IpcRendererEvent, connections: Connection[]) => handler(connections)
    ipcRenderer.on('telemetry:connection:list', listener)
    return () => ipcRenderer.removeListener('telemetry:connection:list', listener)
  },

  onPorts: (handler: (ports: string[]) => void): Unsubscribe => {
    const listener = (_: Electron.IpcRendererEvent, ports: string[]) => handler(ports)
    ipcRenderer.on('telemetry:connection:ports', listener)
    return () => ipcRenderer.removeListener('telemetry:connection:ports', listener)
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
