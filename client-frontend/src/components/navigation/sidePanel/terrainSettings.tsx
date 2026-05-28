import { useEffect, useRef, useState } from 'react'
import { Crosshair } from 'lucide-react'
import { Button } from '@/components/ui/button'
import SidePanelSection from '@/components/ui/sidePanelSection'
import { useRFMap } from '@libs/stores/map'
import {
  clearTerrainCache,
  downloadTerrainForArea,
  getTerrainCacheStats
} from '@libs/world/terrain'
import { useEditor } from '@libs/stores/configurator'
import NumericInput from '@/components/ui/numericInput'

type DownloadPhase =
  | { kind: 'idle' }
  | { kind: 'downloading'; done: number; total: number }
  | { kind: 'done'; downloaded: number; skipped: number }
  | { kind: 'cancelled'; downloaded: number }
  | { kind: 'error' }

export default function TerrainSettings() {
  const { mapRef, terrainPreview, setTerrainPreview } = useRFMap()
  const tool = useEditor(s => s.tool)
  const setTool = useEditor(s => s.setTool)

  const [stats, setStats] = useState<{ count: number; estimatedKb: number } | null>(null)
  const [phase, setPhase] = useState<DownloadPhase>({ kind: 'idle' })

  const abortRef = useRef<AbortController | null>(null)

  const refreshStats = () => {
    getTerrainCacheStats().then((s) => {
      setStats(s)
    })
  }

  useEffect(() => {
    refreshStats()
  }, [])

  const handleUseMapCentre = () => {
    const centre = mapRef?.current?.getCenter()
    if (!centre) return
    setTerrainPreview({
      radiusKm: terrainPreview?.radiusKm ?? 5,
      lat: centre.lat,
      lng: centre.lng
    })
  }

  const handleTogglePickMode = () => {
    setTool(tool === 'selectCache' ? 'waypoint' : 'selectCache')
  }

  const handleDownload = async () => {
    if (!terrainPreview || terrainPreview.radiusKm <= 0) return
    const { lat: latN, lng: lngN, radiusKm: radN } = terrainPreview

    const ctrl = new AbortController()
    abortRef.current = ctrl

    setPhase({ kind: 'downloading', done: 0, total: 1 })

    try {
      const result = await downloadTerrainForArea(
        { lat: latN, lng: lngN },
        radN,
        (done, total) => setPhase({ kind: 'downloading', done, total }),
        ctrl.signal
      )

      if (ctrl.signal.aborted) {
        setPhase({ kind: 'cancelled', downloaded: result.downloaded })
      } else {
        setPhase({ kind: 'done', downloaded: result.downloaded, skipped: result.skipped })
        refreshStats()
      }
    } catch {
      setPhase({ kind: 'error' })
    }
  }

  const handleCancel = () => {
    abortRef.current?.abort()
  }

  const handleClear = async () => {
    await clearTerrainCache()
    setPhase({ kind: 'idle' })
    refreshStats()
  }

  const isDownloading = phase.kind === 'downloading'
  const canDownload = terrainPreview !== null && !isDownloading

  const progressPct =
    phase.kind === 'downloading' && phase.total > 0
      ? Math.round((phase.done / phase.total) * 100)
      : 0

  const statusLine = (() => {
    switch (phase.kind) {
      case 'idle':
        return null
      case 'downloading':
        return `Downloading… ${phase.done.toLocaleString()} / ${phase.total.toLocaleString()} tiles`
      case 'done':
        return `Complete — ${phase.downloaded.toLocaleString()} new, ${phase.skipped.toLocaleString()} already cached`
      case 'cancelled':
        return `Cancelled — ${phase.downloaded.toLocaleString()} tiles downloaded`
      case 'error':
        return 'Download failed — check connection and try again'
    }
  })()

  return (
    <SidePanelSection title="Offline Cache">
      {/* ── Cache info ── */}
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {stats
            ? `${stats.count.toLocaleString()} tiles · ~${stats.estimatedKb} KB`
            : 'Loading…'}
        </p>
        <Button variant="red" size="sm" onClick={handleClear} disabled={isDownloading}>
          Clear
        </Button>
      </div>

      <div className="border-t border-border" />

      {/* ── Location inputs ── */}
      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground">Location</span>
        <div className="flex gap-2 w-full">
          <NumericInput
            name="lat"
            className="w-1/2"
            value={terrainPreview?.lat}
            step={0.001}
            disabled={terrainPreview === null || isDownloading}
            onChange={(e) => {
              setTerrainPreview({
                lat: e.target.value,
                lng: terrainPreview?.lng ?? 0,
                radiusKm: terrainPreview?.radiusKm ?? 5
              })
            }}
          />
          <NumericInput
            name="lng"
            className="w-1/2"
            value={terrainPreview?.lng}
            step={0.001}
            disabled={terrainPreview === null || isDownloading}
            onChange={(e) => {
              setTerrainPreview({
                lat: terrainPreview?.lat ?? 0,
                lng: e.target.value,
                radiusKm: terrainPreview?.radiusKm ?? 5
              })
            }}
          />
        </div>
        <div className="flex gap-2">
          <Button
            className="flex-1"
            variant="default"
            size="sm"
            onClick={handleUseMapCentre}
            disabled={isDownloading}
          >
            Map Centre
          </Button>
          <Button
            variant={tool === 'selectCache' ? 'active' : 'default'}
            size="sm"
            onClick={handleTogglePickMode}
            disabled={isDownloading}
            title={
              tool === 'selectCache'
                ? 'Cancel — click map to set location'
                : 'Click the map to set location'
            }
          >
            <Crosshair className="h-4 w-4" />
          </Button>
        </div>
        {tool === 'selectCache' && (
          <p className="text-xs text-muted-foreground">
            Click anywhere on the map to set the centre…
          </p>
        )}
      </div>

      {/* ── Radius ── */}
      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground">Radius (km)</span>
        <NumericInput
          name="Radius (km)"
          value={terrainPreview?.radiusKm}
          min={0.1}
          max={30}
          step={0.1}
          className="w-full"
          disabled={terrainPreview === null || isDownloading}
          onChange={(e) => {
            setTerrainPreview({
              lat: terrainPreview?.lat ?? 0,
              lng: terrainPreview?.lng ?? 0,
              radiusKm: e.target.value
            })
          }}
        />
      </div>

      {/* ── Action button ── */}
      {isDownloading ? (
        <Button variant="red" size="sm" onClick={handleCancel}>
          Cancel
        </Button>
      ) : (
        <Button size="sm" onClick={handleDownload} disabled={!canDownload}>
          Download
        </Button>
      )}

      {/* ── Progress bar ── */}
      {phase.kind === 'downloading' && (
        <div className="flex flex-col gap-1">
          <div className="w-full bg-muted-foreground/20 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-primary h-full rounded-full transition-all duration-150"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground">{progressPct}%</span>
        </div>
      )}

      {/* ── Status message ── */}
      {statusLine && <p className="text-xs text-muted-foreground">{statusLine}</p>}
    </SidePanelSection>
  )
}
