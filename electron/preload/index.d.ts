import { ElectronAPI } from '@electron-toolkit/preload'
import type { ConnectionCommand, ConnectionMessage } from '@libs/connection/types'

type Unsubscribe = () => void

export type ConnectionAPI = {
  sendCommand: (msg: ConnectionCommand) => void
  onMessage: (handler: (cmd: ConnectionMessage) => void) => Unsubscribe
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: { connection: ConnectionAPI }
    env?: { isElectron?: boolean }
  }
}
