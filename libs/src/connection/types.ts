export type ConnectionStatus = 'connecting' | 'active' | 'error' | 'disconnected'

export interface UDPTransportConfig {
  type: 'udp'
  host: string
  port: number
  bindAddress?: string
}

export interface SerialTransportConfig {
  type: 'serial'
  path: string
  baudRate: number
  dataBits?: 5 | 6 | 7 | 8
  stopBits?: 1 | 1.5 | 2
  parity?: 'none' | 'even' | 'odd' | 'mark' | 'space'
}

export type TransportConfig = UDPTransportConfig | SerialTransportConfig

export interface ActiveConnection {
  transport: ITransportAdapter
  status: ConnectionStats
}

export interface ConnectionStats {
  type: TransportConfig["type"]
  status: ConnectionStatus
  bytesPerSec: number
  lastReceivedAt: number | null
}

export interface AvailableConnection {
  type: string
  label: string
}


// Uint8Array used throughout so this file remains browser-safe.
// Transport implementations in Node context use Buffer (which extends Uint8Array).

// api from the perspective of Connection Manager
export interface ITransportAdapter {
  start(): Promise<void>
  stop(): Promise<void>
  send(data: Uint8Array): void
  on(event: 'data', handler: (data: Uint8Array) => void): void
  on(event: 'error', handler: (error: Error) => void): void
  on(event: 'close', handler: () => void): void
}

// api from the perspective of Connection Manager
export interface IHostAdapter {
  sendData(data: Uint8Array): void
  onCommand(handler: (msg: ConnectionCommand) => void): void
  sendMessage(msg: ConnectionMessage): void
}


export type ConnectionCommand =
  | { type: 'connect', config: TransportConfig }
  | { type: 'disconnect' }
  | { type: 'list' }
  | { type: 'send'; payload: Uint8Array }

export type ConnectionMessage =
  | { type: 'data', payload: Uint8Array }
  | { type: 'status', stats: ConnectionStats }
  | { type: 'availableConnections', connections: AvailableConnection[] }
