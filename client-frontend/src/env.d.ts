/// <reference types="vite/client" />

import type { ConnectionMessage, ConnectionCommand } from '@libs/connection/types'

declare global {
  var __GIT_VERSION__: string

  interface Window {
    api?: {
      connection: {
        sendCommand: (msg: ConnectionCommand) => void
        onMessage: (handler: (msg: ConnectionMessage) => void) => () => void
      }
    }
    env?: { isElectron?: boolean }
  }
}
