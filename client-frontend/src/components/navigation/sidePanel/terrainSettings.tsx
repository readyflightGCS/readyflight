import { useEffect, useRef, useState } from 'react'
import { Crosshair } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import SidePanelSection from '@/components/ui/sidePanelSection'
import { useRFMap } from '@libs/stores/map'
import {
  clearTerrainCache,
  downloadTerrainForArea,
  getTerrainCacheStats
} from '@libs/world/terrain'

// ─── Types ────────────────────────────────────────────────────────────────────

type DownloadPhase =
  | { kind: 'idle' }
  | { kind: 'downloading'; done: number; total: number }
  | { kind: 'done'; downloaded: number; skipped: number }
  | { kind: 'cancelled'; downloaded: number }
  | { kind: 'error' }

// ─── Component ────────────────────────────────────────────────────────────────

export default function TerrainSettings() {
  const { mapRef, terrainPickMode, setTerrainPickMode, setTerrainPreview } = useRFMap()

  const [lat, setLat] = useState('')
  const [lng, setLng] = useState('')
  const [radius, setRadius] = useState('50')
  const [stats, setStats] = useState<{ count: number; estimatedKb: number } | null>(null)
  const [phase, setPhase] = useState<DownloadPhase>({ kind: 'idle' })

  const abortRef = useRef<AbortController | null>(null)
  // Tracks whether we entered pick mode so we can sync inputs when it ends.
  const wasPickingRef = useRef(false)

  // ── Stats ────────────────────────────────────────────────────────────────────

  const refreshStats = () => {
    getTerrainCacheStats().then((s) => {
      setStats(s)
    })
  }

  useEffect(() => {
    refreshStats()
  }, [])

  // ── Cleanup on unmount ────────────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      setTerrainPickMode(false)
      setTerrainPreview(null)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Keep the store preview in sync with the form ──────────────────────────────

  useEffect(() => {
    const latN = parseFloat(lat)
    const lngN = parseFloat(lng)
    const radN = parseFloat(radius)
    if (!isNaN(latN) && !isNaN(lngN) && !isNaN(radN) && radN > 0) {
      setTerrainPreview({ lat: latN, lng: lngN, radiusKm: radN })
    } else {
      setTerrainPreview(null)
    }
  }, [lat, lng, radius, setTerrainPreview])

  // ── Sync inputs back when a map pick completes ────────────────────────────────

  useEffect(() => {
    if (terrainPickMode) {
      wasPickingRef.current = true
      return
    }
    if (wasPickingRef.current) {
      wasPickingRef.current = false
      // Pick mode just ended — pull the coordinates the click handler planted.
      // Defer to avoid the synchronous-setState-in-effect lint rule.
      const preview = useRFMap.getState().terrainPreview
      if (preview) {
        const { lat: pickedLat, lng: pickedLng } = preview
        setTimeout(() => {
          setLat(pickedLat.toFixed(5))
          setLng(pickedLng.toFixed(5))
        }, 0)
      }
    }
  }, [terrainPickMode])

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleUseMapCentre = () => {
    const centre = mapRef?.current?.getCenter()
    if (!centre) return
    setLat(centre.lat.toFixed(5))
    setLng(centre.lng.toFixed(5))
  }

  const handleTogglePickMode = () => {
    setTerrainPickMode(!terrainPickMode)
  }

  const handleDownload = async () => {
    const latN = parseFloat(lat)
    const lngN = parseFloat(lng)
    const radN = parseFloat(radius)
    if (isNaN(latN) || isNaN(lngN) || isNaN(radN) || radN <= 0) return

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

  // ── Derived display values ────────────────────────────────────────────────────

  const isDownloading = phase.kind === 'downloading'
  const canDownload =
    lat.trim() !== '' && lng.trim() !== '' && radius.trim() !== '' && !isDownloading

  const progressPct =
    phase.kind === 'downloading' && phase.total > 0
      ? Math.round((phase.done / phase.total) * 100)
      : 0

  const statusLine = (() => {
    switch (phase.kind) {
      case 'idle':
        return null
      case 'downloading':
        return `Downloading… ${phase.done.toLocaleString()} / ${phase.total.toLocaleString()} cells`
      case 'done':
        return `Complete — ${phase.downloaded.toLocaleString()} new, ${phase.skipped.toLocaleString()} already cached`
      case 'cancelled':
        return `Cancelled — ${phase.downloaded.toLocaleString()} cells downloaded`
      case 'error':
        return 'Download failed — check connection and try again'
    }
  })()

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Cache info ── */}
      <SidePanelSection title="Terrain Cache">
        <p className="text-sm text-muted-foreground">
          {stats
            ? `${stats.count.toLocaleString()} grid cells · ~${stats.estimatedKb} KB`
            : 'Loading…'}
        </p>
        <Button variant="red" size="sm" onClick={handleClear} disabled={isDownloading}>
          Clear Cache
        </Button>
      </SidePanelSection>

      {/* ── Download ── */}
      <SidePanelSection title="Download Terrain">
        {/* Location inputs */}
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Location</span>
          <div className="flex gap-2">
            <Input
              placeholder="Lat"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              disabled={isDownloading}
            />
            <Input
              placeholder="Lng"
              value={lng}
              onChange={(e) => setLng(e.target.value)}
              disabled={isDownloading}
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
              variant={terrainPickMode ? 'active' : 'default'}
              size="sm"
              onClick={handleTogglePickMode}
              disabled={isDownloading}
              title={
                terrainPickMode
                  ? 'Cancel — click map to set location'
                  : 'Click the map to set location'
              }
            >
              <Crosshair className="h-4 w-4" />
            </Button>
          </div>
          {terrainPickMode && (
            <p className="text-xs text-muted-foreground">
              Click anywhere on the map to set the centre…
            </p>
          )}
        </div>

        {/* Radius */}
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Radius (km)</span>
          <Input
            type="number"
            placeholder="50"
            value={radius}
            min={1}
            max={500}
            onChange={(e) => setRadius(e.target.value)}
            disabled={isDownloading}
          />
        </div>

        {/* Action button */}
        {isDownloading ? (
          <Button variant="red" size="sm" onClick={handleCancel}>
            Cancel
          </Button>
        ) : (
          <Button size="sm" onClick={handleDownload} disabled={!canDownload}>
            Download
          </Button>
        )}

        {/* Progress bar */}
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

        {/* Status message */}
        {statusLine && <p className="text-xs text-muted-foreground">{statusLine}</p>}
      </SidePanelSection>
    </>
  )
}
