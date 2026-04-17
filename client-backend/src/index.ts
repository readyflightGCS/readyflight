import { createSocket } from 'dgram'

const UDP_PORT = 14550 // to vehicle
const WS_PORT = 9999 // to frontend

const TOPIC = 'mavlink'

// Track the vehicle's address so we know where to send commands back.
let vehicleAddr: { address: string; port: number } | null = null


// Create a socket listening for mavlink
const udp = createSocket('udp4')
udp.on('message', (msg, rinfo) => {
  vehicleAddr = { address: rinfo.address, port: rinfo.port }
  server.publish(TOPIC, msg)
})
udp.bind({ port: UDP_PORT }, () => console.log(`[udp] listening on ${UDP_PORT}`))


// Create a websocket server to the frontend
const server = Bun.serve({
  port: WS_PORT,
  fetch(req, server) {
    if (server.upgrade(req)) return
    return new Response('MAVLink WebSocket relay')
  },
  websocket: {
    open(ws) { ws.subscribe(TOPIC); console.log('[ws] client connected') },
    close(ws) { ws.unsubscribe(TOPIC); console.log('[ws] client disconnected') },

    // Relay any messages to udp
    message(ws, msg) {
      if (!vehicleAddr) {
        console.warn('[udp] no vehicle address known yet — dropping outbound packet')
        return
      }
      udp.send(msg, vehicleAddr.port, vehicleAddr.address)
    },
  },
})

console.log(`[ws] listening on ${WS_PORT}`)
