import type { IHostAdapter, ConnectionCommand, ConnectionMessage } from '@libs/connection/types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BunWS = any

export class WebSocketHostAdapter implements IHostAdapter {
  private clients = new Set<BunWS>()
  private onCommandHandler: ((cmd: ConnectionCommand) => void) | null = null

  constructor(port: number) {
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
          try {
            msg = JSON.parse(raw)
          } catch {
            return
          }
          if (adapter.onCommandHandler === null) return

          switch (msg.type) {
            case 'connect':
            case 'disconnect':
            case 'list':
              adapter.onCommandHandler(msg)
              break
            case 'send':
              if (msg.payload) {
                adapter.onCommandHandler({
                  type: 'send',
                  payload: Uint8Array.fromBase64(msg.payload)
                })
              }
              break
            default: {
              const _exhaustiveCheck: never = msg
              return _exhaustiveCheck
            }
          }
        }
      }
    })

    console.log(`[ws] listening on ${port}`)
  }

  sendData(data: Uint8Array): void {
    const payload = Buffer.from(data).toString('base64')
    const msg = JSON.stringify({ type: 'data', payload })
    this.clients.forEach((ws) => ws.send(msg))
  }

  sendMessage(msg: ConnectionMessage): void {
    const msgString = JSON.stringify(msg)
    this.clients.forEach((ws) => ws.send(msgString))
  }

  onCommand(handler: (cmd: ConnectionCommand) => void): void {
    this.onCommandHandler = handler
  }
}
