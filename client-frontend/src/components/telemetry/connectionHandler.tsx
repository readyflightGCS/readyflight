import { useDialect } from '@libs/stores/dialect'
import { useVehicle } from '@libs/stores/vehicle'
import { useConnections } from '@libs/stores/connections'
import { useEffect, useRef } from 'react'
import type { ConnectionMessage } from '@libs/connection/types'
import type { ITelemetrySession } from '@libs/dialects/dialect'
import type { VehicleState } from '@libs/vehicle/state'

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
  return btoa(String.fromCharCode(...Array.from(new Uint8Array(buf))))
}

export default function ConnectionHandler() {
  const dialect = useDialect((s) => s.activeDialect)
  const setVehicleState = useVehicle((s) => s.setVehicleState)
  const setConnection = useConnections((s) => s.setConnection)
  const setAvailableConnections = useConnections((s) => s.setAvailableConnections)
  const setCommandSender = useConnections((s) => s.setCommandSender)

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeout = useRef<number | null>(null)
  const sessionRef = useRef<ITelemetrySession | null>(null)
  const patchRef = useRef<Partial<VehicleState>>({})

  // rAF flush loop — runs for the component's lifetime, drains patchRef into the store.
  useEffect(() => {
    let rafId: number
    function flush() {
      if (Object.keys(patchRef.current).length > 0) {
        setVehicleState(patchRef.current)
        patchRef.current = {}
      }
      rafId = requestAnimationFrame(flush)
    }
    rafId = requestAnimationFrame(flush)
    return () => cancelAnimationFrame(rafId)
  }, [setVehicleState])

  useEffect(() => {
    function applyPatch(patch: Partial<VehicleState>) {
      Object.assign(patchRef.current, patch)
    }

    if (isElectron) {
      const api = window.api!.connection

      const sendPacket = (buf: ArrayBuffer) => {
        api.sendCommand({ type: 'sendData', payload: new Uint8Array(buf) })
      }

      const session = dialect.createSession(sendPacket, applyPatch)
      sessionRef.current = session

      setVehicleState({
        sendMessage: (m) => session.handleSendTelemetryMessage(m),
        uploadMission: (m) => session.uploadMission(m as never)
      })

      setCommandSender((cmd) => {
        api.sendCommand(cmd)
      })

      const offMessage = api.onMessage((msg) => {
        switch (msg.type) {
          case 'sendData': {
            applyPatch(session.handleTelemetryMessage(msg.payload))
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
        session.destroy()
        sessionRef.current = null
        patchRef.current = {}
        offMessage()
        setCommandSender(null)
        setVehicleState({ sendMessage: null, uploadMission: null })
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

      const session = dialect.createSession(sendPacket, applyPatch)
      sessionRef.current = session

      ws.onopen = () => {
        console.log('[ws] connected to backend')
        setVehicleState({
          sendMessage: (m) => session.handleSendTelemetryMessage(m),
          uploadMission: (m) => session.uploadMission(m as never)
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
            applyPatch(session.handleTelemetryMessage(msg.payload))
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
        session.destroy()
        sessionRef.current = null
        patchRef.current = {}
        setCommandSender(null)
        setVehicleState({ sendMessage: null, uploadMission: null })
        setAvailableConnections([])
        scheduleReconnect()
      }

      ws.onerror = () => {
        ws.close()
        console.log('[ws] error; reconnecting …')
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
      sessionRef.current?.destroy()
      sessionRef.current = null
      patchRef.current = {}
      const ws = wsRef.current
      wsRef.current = null
      ws?.close()
    }
  }, [dialect, setVehicleState, setConnection, setCommandSender, setAvailableConnections])

  return null
}
