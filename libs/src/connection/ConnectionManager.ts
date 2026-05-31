import { SerialTransportAdapter } from './adapters/SerialTransportAdapter.js'
import { UDPTransportAdapter } from './adapters/UDPTransportAdapter.js'
import type { IHostAdapter, ITransportAdapter, ConnectionCommand, ActiveConnection, TransportConfig } from './types.js'

export class ConnectionManager {
  private hostAdapter: IHostAdapter
  private statsTimer: ReturnType<typeof setInterval> | null
  private connection: ActiveConnection
  private readonly transportAdapters = [
    {
      name: 'serial',
      label: 'Serial',
      t: new SerialTransportAdapter()
    },
    {
      name: 'udp',
      label: 'UDP',
      t: new UDPTransportAdapter()
    }
  ]

  constructor(hostAdapter: IHostAdapter) {
    console.log('[conn-mng] Starting up')
    this.hostAdapter = hostAdapter
    hostAdapter.onCommand((cmd) => this.handleCommand(cmd))
    this.statsTimer = null
    this.connection = {
      transport: null,
      status: {
        type: null,
        status: 'disconnected',
        bytesPerSec: 0,
        lastReceivedAt: Date.now()
      }
    }
  }

  destroy() {
    if (this.connection.transport !== null) {
      this.connection.transport.stop()
    }
  }

  private updateStats(): void {
    if (this.connection === null) {
      return
    }
    this.hostAdapter.sendMessage({ type: 'status', stats: this.connection.status })
  }

  private async listAvailableConnections(): Promise<TransportConfig[][]> {
    return await Promise.all(
      this.transportAdapters.map(async (x) => {
        return await x.t.getAvailable()
      })
    )
  }

  private handleCommand(cmd: ConnectionCommand): void {
    console.log(`[ConnMng] Got message ${cmd.type}`)
    switch (cmd.type) {
      case 'list':
        this.listAvailableConnections().then((res) => {
          this.hostAdapter.sendMessage({ type: 'availableConnections', connections: res })
        })
        break

      case 'connect':
        const transportAdapter = this.transportAdapters.find((x) => x.name === cmd.config.type)
        if (transportAdapter === undefined) return
        const transport = transportAdapter.t as ITransportAdapter<TransportConfig>
        this.connection = {
          transport: transport,
          status: {
            type: cmd.config.type,
            status: 'active',
            bytesPerSec: 0,
            lastReceivedAt: null
          }
        }
        transport.on('data', (a) => this.hostAdapter.sendMessage({ type: 'sendData', payload: a }))
        transport.start(cmd.config).then(() => {
          this.statsTimer = setInterval(() => this.updateStats(), 1000)
        })
        break
      case 'sendData':
        if (this.connection.transport === null) {
          console.log('no connection, dropping data')
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
              status: 'disconnected',
              bytesPerSec: 0,
              lastReceivedAt: Date.now()
            }
          }
          this.hostAdapter.sendMessage({ type: 'status', stats: this.connection.status })
        })
        if (this.statsTimer !== null) {
          clearInterval(this.statsTimer)
        }
        break
      default: {
        const exhaustiveCheck: never = cmd
        return exhaustiveCheck
      }
    }
  }
}
