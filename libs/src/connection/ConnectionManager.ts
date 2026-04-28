import { SerialTransportAdapter } from './adapters/SerialTransportAdapter.js'
import { UDPTransportAdapter } from './adapters/UDPTransportAdapter.js'
import type { IHostAdapter, ConnectionCommand, ActiveConnection, AvailableConnection, ITransportAdapter } from './types.js'

export class ConnectionManager {
  private hostAdapter: IHostAdapter
  private statsTimer: ReturnType<typeof setInterval> | null
  private connection: ActiveConnection
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
    this.statsTimer = null
    this.connection = {
      transport: null,
      status: {
        type: null,
        status: "disconnected",
        bytesPerSec: 0,
        lastReceivedAt: Date.now(),
      }
    }
  }


  private updateStats(): void {
    if (this.connection === null) {
      return
    }
    this.hostAdapter.sendMessage({ type: "status", stats: this.connection.status })
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
        let t: ITransportAdapter | null = null
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
        t.on("data", (a) => this.hostAdapter.sendMessage({type: "sendData", payload: a}))
        t.start().then(() => {
          this.statsTimer = setInterval(() => this.updateStats(), 1000)
        })
        break
      case 'sendData':
        if (this.connection.transport === null) {
          console.log("no connection, dropping data")
          return
        }
        this.connection.transport.send(cmd.payload)
        break
      case 'disconnect':
        if (this.connection.transport === null) return
        this.connection.transport.stop().then(() => {
          this.connection = {
            transport: null,
            status: {
              type: null,
              status: "disconnected",
              bytesPerSec: 0,
              lastReceivedAt: Date.now(),
            }
          }
          this.hostAdapter.sendMessage({ type: "status", stats: this.connection.status })
        })
        if (this.statsTimer !== null){
          clearInterval(this.statsTimer)
        }
        break
      default: {
        let exhaustiveCheck: never = cmd
      }
    }
  }
}
