import { create } from 'zustand'
import type {
  ConnectionCommand,
  ConnectionStats,
  TransportConfig
} from '@libs/connection/types'

interface ConnectionsState {
  connectionStats: ConnectionStats
  // Wired by connectionHandler once the transport is ready
  commandSender: ((cmd: ConnectionCommand) => void) | null

  setConnection: (connection: ConnectionStats) => void
  setCommandSender: (fn: ((cmd: ConnectionCommand) => void) | null) => void
  availableConnections: TransportConfig[]
  setAvailableConnections: (connections: TransportConfig[]) => void
}

export const useConnections = create<ConnectionsState>((set) => ({
  connectionStats: {
    type: null,
    status: 'disconnected',
    bytesPerSec: 0,
    lastReceivedAt: null
  },
  commandSender: null,

  setConnection: (connectionStats) => set({ connectionStats }),

  setCommandSender: (fn) => set({ commandSender: fn }),

  availableConnections: [],
  setAvailableConnections: (connections) => {
    set({
      availableConnections: connections
    })
  }
}))
