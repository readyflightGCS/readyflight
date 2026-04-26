import { SerialTransportAdapter } from './adapters/SerialTransportAdapter.js'
import { UDPTransportAdapter } from './adapters/UDPTransportAdapter.js'
import type { IHostAdapter, ConnectionCommand, ActiveConnection, AvailableConnection, ITransportAdapter } from './types.js'

export class ConnectionManager {
  private hostAdapter: IHostAdapter
  private statsTimer: ReturnType<typeof setInterval>
  private connection: ActiveConnection | null
  private availableConnections = [
    {
      name: "serialTransport",
      label: "Serial",
      factory: SerialTransportAdapter
    },
    {
      name: "udpTransport",
      label: "UDP",
      factory: UDPTransportAdapter
    },
  ]

  constructor(hostAdapter: IHostAdapter) {
    console.log("[conn-mng] Starting up")
    this.hostAdapter = hostAdapter
    hostAdapter.onCommand(cmd => this.handleCommand(cmd))
    this.connection = null
  }


  private broadcastConnection(): void {
    this.hostAdapter.sendMessage({ type: "status", stats: this.connection.status })
  }

  private updateStats(): void {
    if (this.connection === null) {
      return
    }
    this.broadcastConnection()
  }


  private listAvailableConnections(): AvailableConnection[] {
    return this.availableConnections.map((connectionType) => ({
      type: connectionType.name,
      label: connectionType.label,
    }))

  }

  private handleCommand(cmd: ConnectionCommand): void {
    console.log(`[ConnMng] Got message ${cmd.type}`)
    switch (cmd.type) {
      case 'list':
        this.hostAdapter.sendMessage({ type: "availableConnections", connections: this.listAvailableConnections() })
        break

      case 'connect':
        let t: ITransportAdapter = null
        switch (cmd.config.type) {
          case "udp":
            t = new UDPTransportAdapter(cmd.config)
            break
          case "serial":
            t = new SerialTransportAdapter(cmd.config)
            break
        }
        if (t === null) return
        this.connection = {
          transport: t,
          status: {
            type: cmd.config.type,
            status: "active",
            bytesPerSec: 0,
            lastReceivedAt: null,
          }
        }
        t.on("data", (a) => this.hostAdapter.sendData(a))
        t.start().then(() => {
          this.statsTimer = setInterval(() => this.updateStats(), 1000)
        })
        break
      case 'send':
        this.connection.transport.send(cmd.payload)
        break
      case 'disconnect':
        this.connection.transport.stop().then(() => {
          this.connection = {
            transport: null,
            status: {
              type: undefined,
              status: "disconnected",
              bytesPerSec: 0,
              lastReceivedAt: Date.now(),
            }
          }
          this.broadcastConnection()
        })
        clearInterval(this.statsTimer)
        break
      default: {
        let exhaustiveCheck: never = cmd
      }
    }
  }
}
