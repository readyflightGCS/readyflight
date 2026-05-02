import type { IHostAdapter, ConnectionCommand, ConnectionMessage } from '@libs/connection/types'
import { WebSocketServer, WebSocket } from 'ws'
import http from 'http'

// The web socket host adapter is used to communicate with the host from the
// client backend. It's specifically used when on the web version as we can't
// directly receive udp or serial (depending on browser)
//
// This class starts a websocket which any client frontend can connect to.

function fromBase64(b64: string): Uint8Array {
  return new Uint8Array(Buffer.from(b64, 'base64'))
}

export class WebSocketHostAdapter implements IHostAdapter {
  // Every client-frontend connected
  private clients = new Set<WebSocket>()

  // when we recieve a message from client-frontend call this; gets set by connectionManager
  private onCommandHandler: ((cmd: ConnectionCommand) => void) | null = null

  constructor(port: number) {
    const server = http.createServer((_, res) => {
      res.writeHead(200)
      res.end('MAVLink WebSocket relay')
    })

    const wss = new WebSocketServer({ server })

    wss.on('connection', (ws) => {
      // add and remove clients when they join
      this.clients.add(ws)
      console.log('[ws] client connected')

      ws.on('close', () => {
        this.clients.delete(ws)
        console.log('[ws] client disconnected')
      })

      // on recieve message from client-frontend
      ws.on('message', (data) => {
        let data_str = ''
        // convert the raw string to a ConnectionCommand (TODO, maybe use zod)
        if (typeof data !== 'string') {
          data_str = data.toString()
        }

        let msg: ConnectionCommand

        try {
          const parsed = JSON.parse(data_str)
          if (parsed.type === 'sendData') {
            msg = {
              ...parsed,
              payload: fromBase64(parsed.payload)
            }
          } else {
            msg = { ...parsed }
          }
        } catch {
          return
        }
        if (!this.onCommandHandler) return
        // pass to the connectionManager to handle the Command
        this.onCommandHandler(msg)
      })
    })

    server.listen(port, () => {
      console.log(`[ws] listening on ${port}`)
    })
  }

  sendMessage(msg: ConnectionMessage): void {
    let packet
    if (msg.type === 'sendData') {
      packet = { ...msg, payload: Buffer.from(msg.payload).toString('base64') }
    } else {
      packet = { ...msg }
    }
    const msgString = JSON.stringify(packet)
    this.clients.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(msgString)
      }
    })
  }

  onCommand(handler: (cmd: ConnectionCommand) => void): void {
    this.onCommandHandler = handler
  }
}
