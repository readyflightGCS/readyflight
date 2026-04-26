import { ipcMain, type BrowserWindow } from 'electron'
import type {
  IHostAdapter,
  Connection,
  ConnectionStatus,
  ConnectionStats,
  ConnectionCommand,
  ConnectionConfig,
} from '@libs/connection/types'
import { TransportConfig } from '@libs/connection/types.js'

export class ElectronIPCHostAdapter implements IHostAdapter {
  private onCommandHandler: ((cmd: ConnectionCommand) => void) | null = null

  constructor(
    private getWindow: () => BrowserWindow | null,
  ) {
    ipcMain.on('telemetry:command:connect', (_event, config: TransportConfig) => {
      if (this.onCommandHandler === null) return
      this.onCommandHandler({ type: 'connect', config })
    })
    ipcMain.on('telemetry:command:disconnect', (_event) => {
      if (this.onCommandHandler === null) return
      this.onCommandHandler({ type: 'disconnect' })
    })
    ipcMain.on('telemetry:command:list', (_event) => {
      if (this.onCommandHandler === null) return
      this.onCommandHandler({ type: 'list' })
    })
    ipcMain.on('telemetry:command:send', (_event, payload: Uint8Array) => {
      if (this.onCommandHandler === null) return
      this.onCommandHandler({ type: 'send', payload: payload })
    })

  }

  sendData(data: Uint8Array): void {
    this.getWindow()?.webContents.send('telemetry:message:data', Array.from(data))
  }

  sendMessage(msg: ConnectionMessage): void {
    console.log(msg.type)
    switch (msg.type) {
      case "data":
        this.getWindow()?.webContents.send('telemetry:message:data', msg)
        break
      case "status":
        this.getWindow()?.webContents.send('telemetry:message:status', msg)
        break
      case "availableConnections":
        break
    }
  }

  onCommand(handler: (cmd: ConnectionCommand) => void): void {
    this.onCommandHandler = handler
  }
}
