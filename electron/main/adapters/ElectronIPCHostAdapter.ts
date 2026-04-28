import { ipcMain, type BrowserWindow } from 'electron'
import type { IHostAdapter, ConnectionCommand, ConnectionMessage } from '@libs/connection/types'

export class ElectronIPCHostAdapter implements IHostAdapter {
  private onCommandHandler: ((cmd: ConnectionCommand) => void) | null = null

  constructor(private getWindow: () => BrowserWindow | null) {
    ipcMain.on('telemetry:command:msg', (_event, msg: ConnectionCommand) => {
      if (this.onCommandHandler === null) return
      this.onCommandHandler(msg)
    })
  }

  sendMessage(msg: ConnectionMessage): void {
    this.getWindow()?.webContents.send('telemetry:message:msg', msg)
  }

  onCommand(handler: (cmd: ConnectionCommand) => void): void {
    this.onCommandHandler = handler
  }
}
