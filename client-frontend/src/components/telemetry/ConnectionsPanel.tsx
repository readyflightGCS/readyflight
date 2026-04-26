import { useState, useCallback } from "react"
import { useConnections } from "@/stores/connections"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { UDPTransportConfig, SerialTransportConfig, ActiveConnection, ConnectionStats, ConnectionStatus } from "@libs/connection/types"
import { Wifi, Usb, X, Plus, Circle } from "lucide-react"

const isElectron = (window as any).env?.isElectron === true

const BAUD_PRESETS = [9600, 19200, 38400, 57600, 115200, 230400, 460800, 921600]

type TransportType = 'udp' | 'serial'

interface FormErrors {
  host?: string
  port?: string
  path?: string
  baudRate?: string
}

function StatusDot({ status }: { status: ConnectionStatus }) {
  const colors: Record<ConnectionStatus, string> = {
    active: 'text-green-500',
    connecting: 'text-yellow-500',
    error: 'text-red-500',
    disconnected: 'text-muted-foreground',
  }
  return <Circle className={`size-2 fill-current ${colors[status]}`} />
}

function formatBytes(bps: number): string {
  if (bps < 1024) return `${bps} B/s`
  return `${(bps / 1024).toFixed(1)} KB/s`
}

function formatAge(ts: number | null): string {
  if (!ts) return '—'
  const s = Math.floor((Date.now() - ts) / 1000)
  if (s < 5) return 'just now'
  if (s < 60) return `${s}s ago`
  return `${Math.floor(s / 60)}m ago`
}

function ConnectionItem({ conn }: { conn: ConnectionStats }) {
  const commandSender = useConnections(s => s.commandSender)

  const remove = () => commandSender?.({ type: 'disconnect' })

  return (
    <div className="flex flex-col gap-1 rounded-md border bg-background p-2 text-sm">
      <div className="flex items-center gap-2">
        <StatusDot status={conn.status} />
        <span className="flex-1 truncate font-medium">{conn.type}</span>
        <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground flex items-center gap-1">
          {conn.type === 'udp'
            ? <><Wifi className="size-3" /> UDP</>
            : <><Usb className="size-3" /> Serial</>
          }
        </span>
        <button
          onClick={remove}
          className="text-muted-foreground hover:text-foreground"
          aria-label="Remove connection"
        >
          <X className="size-3.5" />
        </button>
      </div>
      <div className="flex gap-3 text-xs text-muted-foreground">
        <span className="capitalize">{conn.status}</span>
        {conn.status === 'active' && (
          <>
            <span>{formatBytes(conn.bytesPerSec)}</span>
            <span>{formatAge(conn.lastReceivedAt)}</span>
          </>
        )}
      </div>
    </div>
  )
}

function AddConnectionForm() {
  const commandSender = useConnections(s => s.commandSender)

  const [transportType, setTransportType] = useState<TransportType>('udp')
  const [host, setHost] = useState('0.0.0.0')
  const [port, setPort] = useState('14550')
  const [serialPath, setSerialPath] = useState('')
  const [baudRate, setBaudRate] = useState('115200')
  const [availablePorts, setAvailablePorts] = useState<string[]>([])
  const [loadingPorts, setLoadingPorts] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})

  const fetchPorts = useCallback(async () => {
    if (!isElectron) return
    setLoadingPorts(true)
    try {
      const ports = await (window as Window & typeof globalThis).api.connection.listPorts()
      setAvailablePorts(ports)
      if (ports.length > 0 && !serialPath) setSerialPath(ports[0] ?? '')
    } finally {
      setLoadingPorts(false)
    }
  }, [serialPath])

  const validate = (): boolean => {
    const errs: FormErrors = {}
    if (transportType === 'udp') {
      if (!host.trim()) errs.host = 'Required'
      const p = parseInt(port, 10)
      if (isNaN(p) || p < 1 || p > 65535) errs.port = 'Must be 1–65535'
    } else {
      if (!serialPath.trim()) errs.path = 'Select a port'
      const b = parseInt(baudRate, 10)
      if (isNaN(b) || b < 1) errs.baudRate = 'Invalid baud rate'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const submit = () => {
    if (!validate()) return
    let transport: UDPTransportConfig | SerialTransportConfig
    if (transportType === 'udp') {
      transport = { type: 'udp', host: host.trim(), port: parseInt(port, 10) }
    } else {
      transport = {
        type: 'serial',
        path: serialPath.trim(),
        baudRate: parseInt(baudRate, 10),
      }
    }
    commandSender?.({ type: 'connect', config: transport })
  }

  return (
    <div className="flex flex-col gap-2 rounded-md border bg-background p-2 text-sm">
      <p className="font-medium">Add Connection</p>

      <div className="flex gap-1">
        {(['udp', 'serial'] as TransportType[]).map(t => (
          <button
            key={t}
            onClick={() => { setTransportType(t); setErrors({}); if (t === 'serial') fetchPorts() }}
            className={`flex-1 rounded py-1 text-xs font-medium transition-colors ${transportType === t
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
          >
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      {transportType === 'udp' ? (
        <>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Bind address</label>
            <Input
              value={host}
              onChange={e => setHost(e.target.value)}
              placeholder="0.0.0.0"
              aria-invalid={!!errors.host}
            />
            {errors.host && <span className="text-xs text-destructive">{errors.host}</span>}
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Port</label>
            <Input
              type="number"
              value={port}
              onChange={e => setPort(e.target.value)}
              placeholder="14550"
              aria-invalid={!!errors.port}
            />
            {errors.port && <span className="text-xs text-destructive">{errors.port}</span>}
          </div>
        </>
      ) : (
        <>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Serial port</label>
            {isElectron && availablePorts.length > 0 ? (
              <Select value={serialPath} onValueChange={setSerialPath}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select port" />
                </SelectTrigger>
                <SelectContent>
                  {availablePorts.map(p => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                value={serialPath}
                onChange={e => setSerialPath(e.target.value)}
                placeholder={loadingPorts ? 'Loading…' : '/dev/ttyUSB0'}
                aria-invalid={!!errors.path}
              />
            )}
            {errors.path && <span className="text-xs text-destructive">{errors.path}</span>}
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Baud rate</label>
            <Select value={baudRate} onValueChange={setBaudRate}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BAUD_PRESETS.map(b => (
                  <SelectItem key={b} value={String(b)}>{b.toLocaleString()}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.baudRate && <span className="text-xs text-destructive">{errors.baudRate}</span>}
          </div>
        </>
      )}

      <div className="flex gap-2">
        <Button size="sm" onClick={submit} className="flex-1">Connect</Button>
      </div>
    </div>
  )
}

export default function ConnectionsPanel() {
  const connection = useConnections(s => s.connectionStats)
  console.log(connection)

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Connections</h3>
      </div>

      {
        connection !== null ?
          <ConnectionItem conn={connection} /> :
          <AddConnectionForm />
      }

    </div>
  )
}
