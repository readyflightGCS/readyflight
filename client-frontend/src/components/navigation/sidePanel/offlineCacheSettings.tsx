import { useEffect, useMemo, useRef, useState } from 'react'
import { Crosshair } from 'lucide-react'
import { Button } from '@/components/ui/button'
import SidePanelSection from '@/components/ui/sidePanelSection'
import NumericInput from '@/components/ui/numericInput'
import { useRFMap } from '@libs/stores/map'
import { useEditor } from '@libs/stores/configurator'
import {
  clearTerrainCache,
  downloadTerrainForArea,
  getTerrainCacheStats
} from '@libs/world/terrain'
import {
  clearTileCache,
  downloadTilesForArea,
  estimateTileCount,
  getTileCacheStats
} from '@libs/world/tiles'

type Phase =
  | { kind: 'idle' }
  | {
      kind: 'downloading'
      terrainDone: number
      terrainTotal: number
      tilesDone: number
      tilesTotal: number
    }
  | { kind: 'done'; terrainNew: number; tilesNew: number }
  | { kind: 'cancelled' }
  | { kind: 'error' }

function ProgressRow({ label, done, total }: { label: string; done: number; total: number }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        <span>
          {done.toLocaleString()} / {total.toLocaleString()}
        </span>
      </div>
      <div className="w-full bg-muted-foreground/20 rounded-full h-1.5 overflow-hidden">
        <div
          className="bg-primary h-full rounded-full transition-all duration-150"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export default function OfflineCacheSettings() {
  const { mapRef, terrainPreview, setTerrainPreview, tileProvider } = useRFMap()
  const tool = useEditor((s) => s.tool)
  const setTool = useEditor((s) => s.setTool)

  const [terrainStats, setTerrainStats] = useState<{ count: number; estimatedKb: number } | null>(
    null
  )
  const [tileStats, setTileStats] = useState<{ count: number; estimatedKb: number } | null>(null)
  const [phase, setPhase] = useState<Phase>({ kind: 'idle' })
  const [minZoom, setMinZoom] = useState(10)
  const [maxZoom, setMaxZoom] = useState(14)
  const abortRef = useRef<AbortController | null>(null)

  const refreshStats = () => {
    getTerrainCacheStats().then(setTerrainStats)
    getTileCacheStats().then(setTileStats)
  }

  useEffect(() => {
    refreshStats()
  }, [])

  const tileEstimate = useMemo(
    () =>
      terrainPreview
        ? estimateTileCount(terrainPreview.pos, terrainPreview.radiusKm, minZoom, maxZoom)
        : null,
    [terrainPreview, minZoom, maxZoom]
  )

  const handleUseMapCentre = () => {
    const centre = mapRef?.current?.getCenter()
    if (!centre) return
    setTerrainPreview({
      radiusKm: terrainPreview?.radiusKm ?? 5,
      pos: centre
    })
  }

  const handleTogglePickMode = () => {
    setTool(tool === 'selectCache' ? 'waypoint' : 'selectCache')
  }

  const handleDownload = async () => {
    if (!terrainPreview || terrainPreview.radiusKm <= 0) return
    const { pos, radiusKm } = terrainPreview

    const ctrl = new AbortController()
    abortRef.current = ctrl

    // Shared mutable progress so both parallel callbacks update the same object.
    const progress = {
      terrain: { done: 0, total: 1 },
      tiles: { done: 0, total: 1 }
    }

    const flush = () => {
      if (ctrl.signal.aborted) return
      setPhase({
        kind: 'downloading',
        terrainDone: progress.terrain.done,
        terrainTotal: progress.terrain.total,
        tilesDone: progress.tiles.done,
        tilesTotal: progress.tiles.total
      })
    }

    flush()

    try {
      const [terrainResult, tilesResult] = await Promise.all([
        downloadTerrainForArea(
          pos,
          radiusKm,
          (done, total) => {
            progress.terrain = { done, total }
            flush()
          },
          ctrl.signal
        ),
        downloadTilesForArea(
          pos,
          radiusKm,
          minZoom,
          maxZoom,
          tileProvider.url,
          tileProvider.subdomains,
          (done, total) => {
            progress.tiles = { done, total }
            flush()
          },
          ctrl.signal
        )
      ])

      if (ctrl.signal.aborted) {
        setPhase({ kind: 'cancelled' })
      } else {
        setPhase({
          kind: 'done',
          terrainNew: terrainResult.downloaded,
          tilesNew: tilesResult.downloaded
        })
        refreshStats()
      }
    } catch {
      if (ctrl.signal.aborted) setPhase({ kind: 'cancelled' })
      else setPhase({ kind: 'error' })
    }
  }

  const handleCancel = () => abortRef.current?.abort()

  const handleClearCache = async () => {
    await clearTerrainCache()
    await clearTileCache()
    refreshStats()
  }

  const isDownloading = phase.kind === 'downloading'
  const canDownload = terrainPreview !== null && !isDownloading

  const statusLine = (() => {
    switch (phase.kind) {
      case 'idle':
      case 'downloading':
        return null
      case 'done':
        return `Done — ${phase.terrainNew.toLocaleString()} terrain pts + ${phase.tilesNew.toLocaleString()} tiles downloaded`
      case 'cancelled':
        return 'Download cancelled'
      case 'error':
        return 'Download failed — check connection and try again'
    }
  })()

  return (
    <SidePanelSection title="Offline Cache">
      {/* ── Cache stats ── */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            Terrain + Tiles:{' '}
            {terrainStats && tileStats
              ? `~${terrainStats.estimatedKb + tileStats.estimatedKb} KB`
              : '…'}
          </p>
          <Button variant="red" size="sm" onClick={handleClearCache} disabled={isDownloading}>
            Clear
          </Button>
        </div>
      </div>

      <div className="border-t border-border" />

      {/* ── Location ── */}
      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground">Location</span>
        <div className="flex gap-2 w-full">
          <NumericInput
            name="lat"
            className="w-1/2"
            value={terrainPreview?.pos.lat}
            step={0.001}
            disabled={terrainPreview === null || isDownloading}
            onChange={(e) =>
              setTerrainPreview({
                pos: {
                  lat: e.target.value,
                  lng: terrainPreview?.pos.lng ?? 0
                },
                radiusKm: terrainPreview?.radiusKm ?? 5
              })
            }
          />
          <NumericInput
            name="lng"
            className="w-1/2"
            value={terrainPreview?.pos.lng}
            step={0.001}
            disabled={terrainPreview === null || isDownloading}
            onChange={(e) =>
              setTerrainPreview({
                pos: {
                  lat: terrainPreview?.pos.lat ?? 0,
                  lng: e.target.value
                },
                radiusKm: terrainPreview?.radiusKm ?? 5
              })
            }
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
            title={tool === 'selectCache' ? 'Cancel pick' : 'Click map to set location'}
          >
            <Crosshair className="h-4 w-4" />
          </Button>
        </div>
        {tool === 'selectCache' && (
          <p className="text-xs text-muted-foreground">Click the map to set the centre…</p>
        )}
      </div>

      {/* ── Radius ── */}
      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground">Radius (km)</span>
        <NumericInput
          name="radius"
          value={terrainPreview?.radiusKm}
          min={0.1}
          max={100}
          step={0.5}
          className="w-full"
          disabled={terrainPreview === null || isDownloading}
          onChange={(e) =>
            setTerrainPreview({
              pos: {
                lat: terrainPreview?.pos.lat ?? 0,
                lng: terrainPreview?.pos.lng ?? 0
              },
              radiusKm: e.target.value
            })
          }
        />
      </div>

      {/* ── Zoom range (tiles only) ── */}
      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground">Tile zoom range</span>
        <div className="flex gap-2 items-center">
          <NumericInput
            name="minZoom"
            value={minZoom}
            min={1}
            max={18}
            step={1}
            className="flex-1 w-1/2"
            disabled={isDownloading}
            onChange={(e) => setMinZoom(Math.max(1, Math.min(e.target.value, maxZoom)))}
          />
          <span className="text-xs text-muted-foreground">–</span>
          <NumericInput
            name="maxZoom"
            value={maxZoom}
            min={1}
            max={18}
            step={1}
            className="flex-1 w-1/2"
            disabled={isDownloading}
            onChange={(e) => setMaxZoom(Math.min(18, Math.max(minZoom, e.target.value)))}
          />
        </div>
        {tileEstimate !== null && (
          <p className="text-xs text-muted-foreground">
            ~{tileEstimate.toLocaleString()} map tiles
          </p>
        )}
      </div>

      {/* ── Action ── */}
      {isDownloading ? (
        <Button variant="red" size="sm" onClick={handleCancel}>
          Cancel
        </Button>
      ) : (
        <Button size="sm" onClick={handleDownload} disabled={!canDownload}>
          Download Terrain & Tiles
        </Button>
      )}

      {/* ── Progress bars ── */}
      {phase.kind === 'downloading' && (
        <div className="flex flex-col gap-2">
          <ProgressRow label="Terrain" done={phase.terrainDone} total={phase.terrainTotal} />
          <ProgressRow label="Map Tiles" done={phase.tilesDone} total={phase.tilesTotal} />
        </div>
      )}

      {statusLine && <p className="text-xs text-muted-foreground">{statusLine}</p>}
    </SidePanelSection>
  )
}
