import type { ITransportAdapter, SerialTransportConfig } from '@libs/connection/types'

type DataHandler = (data: Uint8Array) => void
type ErrorHandler = (error: Error) => void
type CloseHandler = () => void

export class SerialTransportAdapter implements ITransportAdapter<SerialTransportConfig> {
  private port: unknown = null
  private dataHandlers: DataHandler[] = []
  private errorHandlers: ErrorHandler[] = []
  private closeHandlers: CloseHandler[] = []

  async start(config: SerialTransportConfig): Promise<void> {
    const sp = new SerialPort({
      path: config.path,
      baudRate: config.baudRate,
      dataBits: config.dataBits ?? 8,
      stopBits: config.stopBits ?? 1,
      parity: config.parity ?? 'none',
      autoOpen: false,
    })
    this.port = sp

    await new Promise<void>((resolve, reject) => {
      sp.open((err) => {
        if (err) reject(err)
        else resolve()
      })
    })

    sp.on('data', (data: Buffer) => {
      this.dataHandlers.forEach(h => h(new Uint8Array(data.buffer, data.byteOffset, data.byteLength)))
    })
    sp.on('error', (err: Error) => {
      this.errorHandlers.forEach(h => h(err))
    })
    sp.on('close', () => {
      this.closeHandlers.forEach(h => h())
    })

    console.log(`[serial] opened ${config.path} @ ${config.baudRate}`)
  }

  async stop(): Promise<void> {
    const sp = this.port as { isOpen: boolean; close: (cb: (err?: Error | null) => void) => void } | null
    if (!sp?.isOpen) return
    return new Promise(resolve => sp.close(() => resolve()))
  }

  send(data: Uint8Array): void {
    const sp = this.port as { write: (data: Buffer) => void } | null
    if (!sp) return
    sp.write(Buffer.from(data))
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
    const ports = await SerialPort.list()
    let res: SerialTransportConfig[] = ports.map((port) => {
      return {
        type: 'serial',
        path: port.path as string,
        baudRate: 115200,
      }
    })
    return res

  }
}
