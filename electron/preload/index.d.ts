import { ElectronAPI } from '@electron-toolkit/preload'
import type { ConnectionConfig, Connection, ConnectionStatus, ConnectionStats } from '@libs/connection/types'

type DataPayload = { connectionId: string; payload: number[] }
type StatusPayload = { connectionId: string; status: ConnectionStatus } & ConnectionStats
type Unsubscribe = () => void

interface ConnectionAPI {
  add: (config: ConnectionConfig) => void
  remove: (id: string) => void
  send: (connectionId: string, payload: number[]) => void
  list: () => void
  listPorts: () => Promise<string[]>
  onData: (handler: (data: DataPayload) => void) => Unsubscribe
  onStatus: (handler: (data: StatusPayload) => void) => Unsubscribe
  onConnections: (handler: (connections: Connection[]) => void) => Unsubscribe
  onPorts: (handler: (ports: string[]) => void) => Unsubscribe
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: { connection: ConnectionAPI }
    env?: { isElectron?: boolean }
  }
}
