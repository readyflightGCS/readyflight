import { ConnectionManager } from '@libs/connection/ConnectionManager'
import { WebSocketHostAdapter } from '@client-backend/adapters/WebSocketHostAdapter'

const WS_PORT = 9999

const hostAdapter = new WebSocketHostAdapter(WS_PORT)

new ConnectionManager(hostAdapter)
