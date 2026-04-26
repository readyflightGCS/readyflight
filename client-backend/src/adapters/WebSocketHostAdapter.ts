import type {
  IHostAdapter,
  ConnectionCommand,
  ConnectionMessage,
} from '@libs/connection/types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BunWS = any

export class WebSocketHostAdapter implements IHostAdapter {
  private clients = new Set<BunWS>()
  private onCommandHandler: ((cmd: ConnectionCommand) => void) | null = null

  constructor(port: number, portLister?: () => Promise<string[]>) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const adapter = this

    Bun.serve({
      port,
      fetch(req, server) {
        if (server.upgrade(req)) return undefined
        return new Response('MAVLink WebSocket relay')
      },
      websocket: {
        open(ws) {
          adapter.clients.add(ws)
          console.log('[ws] client connected')
        },
        close(ws) {
          adapter.clients.delete(ws)
          console.log('[ws] client disconnected')
        },
        message(ws, raw) {
          if (typeof raw !== 'string') return
          let msg: ConnectionCommand
          try { msg = JSON.parse(raw) } catch { return }
          if (adapter.onCommandHandler === null) return

          switch (msg.type) {
            case 'connect':
            case 'disconnect':
            case 'list':
              adapter.onCommandHandler(msg)
              break
            case 'send':
              if (msg.connectionId && msg.payload) {
                const bytes = Uint8Array.from(atob(msg.payload), c => c.charCodeAt(0))
                adapter.onCommandHandler({
                  type: 'send',
                  connectionId: msg.connectionId!,
                  payload: bytes,
                })
              }
              break
            default: {
              let exhaustiveCheck: never = msg
            }
          }
        },
      },
    })

    console.log(`[ws] listening on ${port}`)
  }

  sendData(data: Uint8Array): void {
    const payload = Buffer.from(data).toString('base64')
    const msg = JSON.stringify({ type: 'data', payload })
    this.clients.forEach(ws => ws.send(msg))
  }

  sendMessage(msg: ConnectionMessage) {
    const msgString = JSON.stringify(msg)
    this.clients.forEach(ws => ws.send(msgString))
  }


  onCommand(handler: (cmd: ConnectionCommand) => void): void {
    this.onCommandHandler = handler
  }
}
