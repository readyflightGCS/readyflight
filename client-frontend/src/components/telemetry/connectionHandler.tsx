import { useMission } from "@/stores/mission"
import { useVehicle } from "@/stores/vehicle"
import { useEffect, useRef } from "react"

export default function ConnectionHandler() {
  const dialect = useMission(s => s.dialect)
  const setVehicleState = useVehicle(s => s.setVehicleState)

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeout = useRef<number | null>(null)
  const reconnectDelay = useRef(1000)

  useEffect(() => {
    let isMouted = true

    const connect = () => {
      if (!isMouted) return

      const ws = new WebSocket('ws://localhost:9999')
      ws.binaryType = 'arraybuffer'
      wsRef.current = ws

      ws.onopen = () => {
        console.log("[ws] Connected to backend")
        reconnectDelay.current = 1000
      }

      ws.onmessage = (e) => {
        dialect.handleTelemetryMessage(e.data as ArrayBuffer, setVehicleState)
      }

      ws.onclose = () => {
        console.log("[ws] Lost connection to backend; Reconnecting ...")
        scheduleReconnect()
      }

      ws.onerror = () => {
        ws.close()
      }
    }

    const scheduleReconnect = () => {
      if (!isMouted) return
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current)
      }

      reconnectTimeout.current = window.setTimeout(() => {
        reconnectDelay.current = Math.min(reconnectDelay.current * 2, 10000)
        connect()
      }, reconnectDelay.current)
    }

    connect()
    return () => {
      isMouted = false

      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current)
      }

      if (wsRef.current) {
        wsRef.current.close()
      }
    }

  }, [dialect, setVehicleState])
  return null
}
