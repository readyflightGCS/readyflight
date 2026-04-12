import { createSocket } from 'dgram'

const UDP_PORT = 14550
const WS_PORT = 9999
const TOPIC = 'mavlink'

const server = Bun.serve({
  port: WS_PORT,
  fetch(req, server) {
    if (server.upgrade(req)) return
    return new Response('MAVLink WebSocket relay')
  },
  websocket: {
    open(ws) { ws.subscribe(TOPIC); console.log('[ws] client connected') },
    close(ws) { ws.unsubscribe(TOPIC); console.log('[ws] client disconnected') },
    message() { },
  },
})

const udp = createSocket('udp4')
udp.on('message', (msg) => server.publish(TOPIC, msg))
udp.bind({ port: UDP_PORT }, () => console.log(`[udp] listening on ${UDP_PORT}`))

console.log(`[ws] listening on ${WS_PORT}`)
