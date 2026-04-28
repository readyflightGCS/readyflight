import type { IHostAdapter, ConnectionCommand, ConnectionMessage } from '@libs/connection/types'
import type { ServerWebSocket } from 'bun'

import { tryCatchS } from '@libs/util/try-catch'

// The web socket host adapter is used to communicate with the host from the 
// client backend. It's specifically used when on the web version as we can't
// directly receive udp or serial (depending on browser)
//
// This class starts a websocket which any client frontend can connect to.

export class WebSocketHostAdapter implements IHostAdapter {

  // Every client-frontend connected
  private clients = new Set<ServerWebSocket>()

  // when we recieve a message from client-frontend call this; gets set by connectionManager
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

        // add and remove clients when they join
        open(ws) {
          adapter.clients.add(ws)
          console.log('[ws] client connected')
        },
        close(ws) {
          adapter.clients.delete(ws)
          console.log('[ws] client disconnected')
        },

        // on recieve message from client-frontend
        message(ws, raw) {
          // convert the raw string to a ConnectionCommand (TODO, maybe use zod)
          if (typeof raw !== 'string') return
          let msg: ConnectionCommand
          try {
            let msga = JSON.parse(raw)
            if (msga.type === "sendData"){
              let payload = msga.payload
              let b64Payload = Uint8Array.fromBase64(payload)
              msg = {...msga, payload: b64Payload}
            }else{
              msg = {...msga}
            }
          } catch {
            return
          }
          if (adapter.onCommandHandler === null || msg === undefined) return

          // pass to the connectionManager to handle the Command
          adapter.onCommandHandler(msg)
        }
      }
    })

    console.log(`[ws] listening on ${port}`)
  }

  sendMessage(msg: ConnectionMessage): void {
    let packet
    if (msg.type === "sendData"){
      packet = {...msg, payload: Buffer.from(msg.payload).toString('base64')}
    }else{
      packet = {...msg}
    }
    const msgString = JSON.stringify(packet)
    this.clients.forEach((ws) => {
      ws.send(msgString)
    })
  }

  onCommand(handler: (cmd: ConnectionCommand) => void): void {
    this.onCommandHandler = handler
  }
}
