import { useMission } from "@/stores/mission"
import { useVehicle } from "@/stores/vehicle"
import { useConnections } from "@/stores/connections"
import { useEffect, useRef } from "react"
import type { ConnectionMessage, ConnectionStatus } from "@libs/connection/types"

const isElectron = (window as any).env?.isElectron === true

function base64ToArrayBuffer(b64: string): ArrayBuffer {
  const raw = atob(b64)
  const bytes = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i)
  return bytes.buffer
}

function arrayBufferToBase64(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
}

export default function ConnectionHandler() {
  const dialect = useMission(s => s.dialect)
  const setVehicleState = useVehicle(s => s.setVehicleState)
  const setConnection = useConnections(s => s.setConnection)
  const setAvailableConnections = useConnections(s => s.setAvailableConnections)
  const setCommandSender = useConnections(s => s.setCommandSender)

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeout = useRef<number | null>(null)
  const reconnectDelay = useRef(1000)
  const activeConnectionIdRef = useRef<string | null>(null)

  useEffect(() => {
    let isMounted = true

    if (isElectron) {
      const api = (window as Window & typeof globalThis).api.connection

      const sendPacket = (buf: ArrayBuffer) => {
        const id = activeConnectionIdRef.current
        if (!id) return
        api.send(id, Array.from(new Uint8Array(buf)))
      }

      setVehicleState({
        sendMessage: (m) => dialect.handleSendTelemetryMessage(m, sendPacket),
        sendPacket,
      })

      setCommandSender((cmd: object) => {
        const c = cmd as { type: string; config?: unknown; id?: string }
        if (c.type === 'add') api.add(c.config as Parameters<typeof api.add>[0])
        else if (c.type === 'remove' && c.id) api.remove(c.id)
        else if (c.type === 'list') api.list()
      })

      const offData = api.onData(({ payload }) => {
        if (!isMounted) return
        const buf = new Uint8Array(payload).buffer
        dialect.handleTelemetryMessage(buf, setVehicleState, sendPacket)
      })

      const offStatus = api.onStatus(({ status, bytesPerSec, lastReceivedAt }) => {
        if (!isMounted) return
        setConnection(status)
      })

      const offConnections = api.onConnections((connection: Activeconnection | null) => {
        if (!isMounted) return
        setConnection(connection)
      })

      api.list()

      return () => {
        isMounted = false
        offData()
        offStatus()
        offConnections()
        setCommandSender(null)
        setVehicleState({ sendMessage: null, sendPacket: null })
      }
    }

    // WebSocket mode (web build)
    const connect = () => {
      if (!isMounted) return

      const ws = new WebSocket('ws://localhost:9999')
      wsRef.current = ws

      const sendPacket = (buf: ArrayBuffer) => {
        if (ws.readyState !== WebSocket.OPEN) return
        ws.send(JSON.stringify({
          type: 'send',
          payload: arrayBufferToBase64(buf),
        }))
      }

      ws.onopen = () => {
        if (!isMounted) return
        console.log('[ws] connected to backend')
        reconnectDelay.current = 1000
        setVehicleState({
          sendMessage: (m) => dialect.handleSendTelemetryMessage(m, sendPacket),
          sendPacket,
        })
        setCommandSender((cmd) => {
          console.log(cmd)
          if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(cmd))
        })
        ws.send(JSON.stringify({ type: 'list' }))
      }

      ws.onmessage = (e) => {
        if (!isMounted) return
        let msg: ConnectionMessage
        let msga

        try { msga = JSON.parse(e.data as string) } catch { return }
        if (msga.type === "data") {
          msg = { ...msga, payload: base64ToArrayBuffer(msga.payload) }

        } else {
          msg = msga
        }

        switch (msg.type) {
          case 'data': {
            dialect.handleTelemetryMessage(msg.payload, setVehicleState, sendPacket)
            break
          }
          case 'status': {
            console.log(msg)
            setConnection(msg.stats)
            break
          }
          case 'availableConnections': {
            setAvailableConnections(msg.connections)
            break
          }
          default: {
            let exhaustiveCheck: never = msg
          }
        }
      }

      ws.onclose = () => {
        console.log('[ws] lost connection to backend; reconnecting …')
        scheduleReconnect()
        setCommandSender(null)
        setVehicleState({ sendMessage: null, sendPacket: null })
      }

      ws.onerror = () => {
        ws.close()
        setCommandSender(null)
        setVehicleState({ sendMessage: null, sendPacket: null })
      }
    }

    const scheduleReconnect = () => {
      if (!isMounted) return
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current)
      reconnectTimeout.current = window.setTimeout(() => {
        reconnectDelay.current = Math.min(reconnectDelay.current * 2, 1)
        connect()
      }, reconnectDelay.current)
    }

    connect()

    return () => {
      isMounted = false
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current)
      wsRef.current?.close()
    }
  }, [dialect, setVehicleState, setConnection, setCommandSender])

  return null
}
