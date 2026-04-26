import { ipcMain, type BrowserWindow } from 'electron'
import type {
  IHostAdapter,
  Connection,
  ConnectionStatus,
  ConnectionStats,
  ConnectionCommand,
  ConnectionConfig,
} from '@libs/connection/types'

export class ElectronIPCHostAdapter implements IHostAdapter {
  private commandHandlers: ((cmd: ConnectionCommand) => void)[] = []

  constructor(
    private getWindow: () => BrowserWindow | null,
    private portLister: () => Promise<string[]>
  ) {
    ipcMain.on('telemetry:connection:add', (_event, config: ConnectionConfig) => {
      this.commandHandlers.forEach(h => h({ type: 'add', config }))
    })

    ipcMain.on('telemetry:connection:remove', (_event, id: string) => {
      this.commandHandlers.forEach(h => h({ type: 'remove', id }))
    })

    ipcMain.on('telemetry:connection:send', (_event, { connectionId, payload }: { connectionId: string; payload: number[] }) => {
      this.commandHandlers.forEach(h => h({
        type: 'send',
        connectionId,
        payload: new Uint8Array(payload),
      }))
    })

    ipcMain.on('telemetry:connection:list', () => {
      this.commandHandlers.forEach(h => h({ type: 'list' }))
    })

    ipcMain.handle('telemetry:connection:list-ports', async () => {
      return await this.portLister()
    })
  }

  send(connectionId: string, data: Uint8Array): void {
    this.getWindow()?.webContents.send('telemetry:connection:data', {
      connectionId,
      payload: Array.from(data),
    })
  }

  sendStatus(connectionId: string, status: ConnectionStatus, stats: ConnectionStats): void {
    this.getWindow()?.webContents.send('telemetry:connection:status', {
      connectionId,
      status,
      ...stats,
    })
  }

  sendConnections(connections: Connection[]): void {
    this.getWindow()?.webContents.send('telemetry:connection:list', connections)
  }

  sendPorts(ports: string[]): void {
    this.getWindow()?.webContents.send('telemetry:connection:ports', ports)
  }

  onCommand(handler: (cmd: ConnectionCommand) => void): void {
    this.commandHandlers.push(handler)
  }
}
