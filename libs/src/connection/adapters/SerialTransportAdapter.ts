import type { ITransportAdapter, SerialTransportConfig } from '@libs/connection/types'
import { SerialPort } from 'serialport'

import { Transform, TransformCallback } from 'stream'

export class FixedChunkParser extends Transform {
  private buffer: Buffer = Buffer.alloc(0)
  private readonly chunkSize: number

  constructor(chunkSize: number = 30) {
    super()
    this.chunkSize = chunkSize
  }

  _transform(chunk: Buffer, _encoding: BufferEncoding, callback: TransformCallback) {
    // Append incoming data
    this.buffer = Buffer.concat([this.buffer, chunk])

    // While we have enough data, emit chunks
    while (this.buffer.length >= this.chunkSize) {
      const packet = this.buffer.subarray(0, this.chunkSize)
      this.push(packet)

      // Remove emitted bytes
      this.buffer = this.buffer.subarray(this.chunkSize)
    }

    callback()
  }

  _flush(callback: TransformCallback) {
    // Optional: emit remaining data (or discard)
    if (this.buffer.length > 0) {
      this.push(this.buffer)
    }
    callback()
  }
}

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

    const parser = new FixedChunkParser(30)
    sp.pipe(parser)
    parser.on('data', (packet: Buffer) => {
      this.dataHandlers.forEach(h => h(new Uint8Array(packet)))
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
    const res: SerialTransportConfig[] = ports.map((port) => ({
      type: 'serial',
      path: port.path as string,
      baudRate: 115200,
    }))
    return res
  }
}
