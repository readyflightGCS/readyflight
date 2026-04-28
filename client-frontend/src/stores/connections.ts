import { create } from 'zustand'
import type { AvailableConnection, ConnectionCommand, ConnectionStats } from '@libs/connection/types'

interface ConnectionsState {
  connectionStats: ConnectionStats
  // Wired by connectionHandler once the transport is ready
  commandSender: ((cmd: ConnectionCommand) => void) | null

  setConnection: (connection: ConnectionStats) => void
  setCommandSender: (fn: ((cmd: ConnectionCommand) => void) | null) => void
  availableConnections: AvailableConnection[]
  setAvailableConnections: (connections: AvailableConnection[]) => void
}

export const useConnections = create<ConnectionsState>((set) => ({
  connectionStats: {
    type: null,
    status: "disconnected",
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
