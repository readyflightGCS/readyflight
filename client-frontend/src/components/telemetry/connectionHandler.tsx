import { useMission } from "@/stores/mission"
import { useVehicle } from "@/stores/vehicle"
import { useConnections } from "@/stores/connections"
import { useEffect, useRef } from "react"
import type { ConnectionMessage } from "@libs/connection/types"

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

  useEffect(() => {
    let isMounted = true

    if (isElectron) {
      const api = (window as Window & typeof globalThis).api.connection

      const sendPacket = (buf: ArrayBuffer) => {
        api.sendCommand({type:"sendData", payload: new Uint8Array(buf) })
      }


      setVehicleState({
        sendMessage: (m) => dialect.handleSendTelemetryMessage(m, sendPacket),
        sendPacket,
      })

      setCommandSender((cmd) => {
        api.sendCommand(cmd)
      })

      const offMessage = api.onMessage((msg) => {
        switch (msg.type) {
          case 'sendData': {
            dialect.handleTelemetryMessage(msg.payload, setVehicleState, sendPacket)
            break
          }
          case 'status': {
            setConnection(msg.stats)
            break
          }
          case 'availableConnections': {
            setAvailableConnections(msg.connections)
            break
          }
          default: {
            let exhaustiveCheck: never = msg
            return exhaustiveCheck
          }
        }
      })

      api.sendCommand({type: "list"})

      return () => {
        isMounted = false
        offMessage()
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
          type: 'sendData',
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
          if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(cmd))
        })
        ws.send(JSON.stringify({ type: 'list' }))
      }

      ws.onmessage = (e) => {
        if (!isMounted) return
        let msg: ConnectionMessage
        let msga

        try { msga = JSON.parse(e.data as string) } catch { return }
        if (msga.type === "sendData") {
          msg = {...msga, payload: base64ToArrayBuffer(msga.payload)}
        } else {
          msg = msga
        }

        switch (msg.type) {
          case 'sendData': {
            dialect.handleTelemetryMessage(msg.payload, setVehicleState, sendPacket)
            break
          }
          case 'status': {
            setConnection(msg.stats)
            break
          }
          case 'availableConnections': {
            setAvailableConnections(msg.connections)
            break
          }
          default: {
            let exhaustiveCheck: never = msg
            return exhaustiveCheck
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
