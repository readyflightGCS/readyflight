import { useMission } from '@libs/stores/mission'
import { useVehicle } from '@libs/stores/vehicle'
import { useConnections } from '@libs/stores/connections'
import { useEffect, useRef } from 'react'
import type { ConnectionMessage } from '@libs/connection/types'

const isElectron =
  (window as unknown as { env?: { isElectron?: boolean } }).env?.isElectron === true

function base64ToUint8Array(b64: string): Uint8Array {
  const binary = atob(b64)
  const len = binary.length
  const bytes = new Uint8Array(len)

  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i)
  }

  return bytes
}

function arrayBufferToBase64(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
}

export default function ConnectionHandler() {
  const dialect = useMission((s) => s.dialect)
  const setVehicleState = useVehicle((s) => s.setVehicleState)
  const setConnection = useConnections((s) => s.setConnection)
  const setAvailableConnections = useConnections((s) => s.setAvailableConnections)
  const setCommandSender = useConnections((s) => s.setCommandSender)

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeout = useRef<number | null>(null)

  useEffect(() => {
    if (isElectron) {
      const api = (window as Window & typeof globalThis).api.connection

      const sendPacket = (buf: ArrayBuffer) => {
        api.sendCommand({ type: 'sendData', payload: new Uint8Array(buf) })
      }

      setVehicleState({
        sendMessage: (m) => dialect.handleSendTelemetryMessage(m, sendPacket),
        sendPacket
      })

      setCommandSender((cmd) => {
        api.sendCommand(cmd)
      })

      const offMessage = api.onMessage((msg) => {
        switch (msg.type) {
          case 'sendData': {
            dialect.handleTelemetryMessage(msg.payload, sendPacket)
            break
          }
          case 'status': {
            setConnection(msg.stats)
            break
          }
          case 'availableConnections': {
            setAvailableConnections(msg.connections.flat())
            break
          }
          default: {
            const exhaustiveCheck: never = msg
            return exhaustiveCheck
          }
        }
      })

      api.sendCommand({ type: 'list' })

      return () => {
        offMessage()
        setCommandSender(null)
        setVehicleState({ sendMessage: null, sendPacket: null })
      }
    }

    // WebSocket mode (web build)
    const connect = () => {
      const ws = new WebSocket('ws://localhost:9999')
      wsRef.current = ws

      const sendPacket = (buf: ArrayBuffer) => {
        if (ws.readyState !== WebSocket.OPEN) return
        ws.send(
          JSON.stringify({
            type: 'sendData',
            payload: arrayBufferToBase64(buf)
          })
        )
      }

      ws.onopen = () => {
        console.log('[ws] connected to backend')
        setVehicleState({
          sendMessage: (m) => dialect.handleSendTelemetryMessage(m, sendPacket),
          sendPacket
        })
        setCommandSender((cmd) => {
          if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(cmd))
        })
        ws.send(JSON.stringify({ type: 'list' }))
      }

      ws.onmessage = (e) => {
        let msg: ConnectionMessage
        let msga

        try {
          msga = JSON.parse(e.data as string)
        } catch {
          return
        }
        if (msga.type === 'sendData') {
          msg = {
            ...msga,
            payload: base64ToUint8Array(msga.payload)
          }
        } else {
          msg = msga
        }

        switch (msg.type) {
          case 'sendData': {
            dialect.handleTelemetryMessage(msg.payload, sendPacket)
            break
          }
          case 'status': {
            setConnection(msg.stats)
            break
          }
          case 'availableConnections': {
            setAvailableConnections(msg.connections.flat())
            break
          }
          default: {
            const exhaustiveCheck: never = msg
            return exhaustiveCheck
          }
        }
      }

      ws.onclose = () => {
        console.log('[ws] lost connection to backend; reconnecting …')
        scheduleReconnect()
        setCommandSender(null)
        setVehicleState({ sendMessage: null, sendPacket: null })
        setAvailableConnections([])
      }

      ws.onerror = () => {
        ws.close()
        console.log('[ws] error; reconnecting …')
        scheduleReconnect()
        setCommandSender(null)
        setVehicleState({ sendMessage: null, sendPacket: null })
        setAvailableConnections([])
      }
    }

    const scheduleReconnect = () => {
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current)
      reconnectTimeout.current = window.setTimeout(() => {
        connect()
      }, 1000)
    }

    connect()

    return () => {
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current)
      const ws = wsRef.current
      wsRef.current = null
      ws?.close()
    }
  }, [dialect, setVehicleState, setConnection, setCommandSender, setAvailableConnections])

  return null
}
