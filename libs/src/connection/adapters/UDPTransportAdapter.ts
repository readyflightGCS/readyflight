import { createSocket, type Socket } from 'node:dgram'
import type { ITransportAdapter, UDPTransportConfig } from '../types.js'

function isMulticast(host: string): boolean {
  const parts = host.split('.').map(Number)
  if (parts.length !== 4) return false
  const first = parts[0]
  return first !== undefined && first >= 224 && first <= 239
}

type DataHandler = (data: Uint8Array) => void
type ErrorHandler = (error: Error) => void
type CloseHandler = () => void

export class UDPTransportAdapter implements ITransportAdapter<UDPTransportConfig> {
  private socket: Socket | null = null
  private vehicleAddr: { address: string; port: number } | null = null
  private dataHandlers: DataHandler[] = []
  private errorHandlers: ErrorHandler[] = []
  private closeHandlers: CloseHandler[] = []

  async start(config: UDPTransportConfig): Promise<void> {
    return new Promise((resolve, reject) => {
      const socket = createSocket('udp4')
      this.socket = socket

      socket.on('message', (msg, rinfo) => {
        this.vehicleAddr = { address: rinfo.address, port: rinfo.port }
        this.dataHandlers.forEach((h) =>
          h(new Uint8Array(msg.buffer, msg.byteOffset, msg.byteLength))
        )
      })

      socket.on('error', (err) => {
        this.errorHandlers.forEach((h) => h(err))
      })

      socket.on('close', () => {
        this.closeHandlers.forEach((h) => h())
      })

      const bindAddr = config.bindAddress ?? '0.0.0.0'
      socket.bind(config.port, bindAddr, () => {
        if (isMulticast(config.host)) {
          try {
            socket.addMembership(config.host, bindAddr === '0.0.0.0' ? undefined : bindAddr)
          } catch (err) {
            socket.close()
            reject(err)
            return
          }
        }
        console.log(`[udp] bound on ${bindAddr}:${config.port}`)
        resolve()
      })
    })
  }

  async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.socket) {
        resolve()
        return
      }
      this.socket.close(() => resolve())
      this.socket = null
      console.log('[udp] Stopped')
    })
  }

  send(data: Uint8Array): void {
    if (!this.socket || !this.vehicleAddr) {
      console.warn('[udp] no vehicle address known yet — dropping outbound packet')
      return
    }
    const buf = Buffer.isBuffer(data) ? data : Buffer.from(data)
    this.socket.send(buf, this.vehicleAddr.port, this.vehicleAddr.address)
  }

  on(event: 'data', handler: DataHandler): void
  on(event: 'error', handler: ErrorHandler): void
  on(event: 'close', handler: CloseHandler): void
  on(event: string, handler: DataHandler | ErrorHandler | CloseHandler): void {
    if (event === 'data') this.dataHandlers.push(handler as DataHandler)
    else if (event === 'error') this.errorHandlers.push(handler as ErrorHandler)
    else if (event === 'close') this.closeHandlers.push(handler as CloseHandler)
  }

  async getAvailable() {
    const res: UDPTransportConfig[] = [
      {
        type: 'udp',
        host: '0.0.0.0',
        port: 14550
      }
    ]
    return new Promise<UDPTransportConfig[]>((resolve) => {
      resolve(res)
    })
  }
}
