import { useEffect, useState } from 'react'
import { LayerGroup, Rectangle } from 'react-leaflet'
import { useRFMap } from '@libs/stores/map'
import { getAllTileKeys } from '@libs/world/tiles'

/** Returns the [[south, west], [north, east]] bounds of a Web Mercator tile. */
function tileBounds(x: number, y: number, z: number): [[number, number], [number, number]] {
  const n = 2 ** z
  const west = (x / n) * 360 - 180
  const east = ((x + 1) / n) * 360 - 180
  const north = (Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / n))) * 180) / Math.PI
  const south = (Math.atan(Math.sinh(Math.PI * (1 - (2 * (y + 1)) / n))) * 180) / Math.PI
  return [
    [south, west],
    [north, east]
  ]
}

/** Parses a tile cache key of the form `${urlTemplate}::${z}::${x}::${y}`. */
function parseKey(key: string): { z: number; x: number; y: number } | null {
  const parts = key.split('::')
  if (parts.length < 4) return null
  const y = parseInt(parts[3])
  const x = parseInt(parts[2])
  const z = parseInt(parts[1])
  if (isNaN(x) || isNaN(y) || isNaN(z)) return null
  return { z, x, y }
}

export default function TileCacheLayer() {
  const showTileCache = useRFMap((s) => s.viewable['tile cache'])
  const tileUrl = useRFMap((s) => s.tileProvider.url)
  const [cachedKeys, setCachedKeys] = useState<string[]>([])

  useEffect(() => {
    if (!showTileCache) return
    const prefix = tileUrl + '::'
    getAllTileKeys().then((all) => setCachedKeys(all.filter((k) => k.startsWith(prefix))))
  }, [showTileCache, tileUrl])

  // cachedKeys may hold stale data when hidden — guard render with showTileCache
  if (!showTileCache || cachedKeys.length === 0) return null

  return (
    <LayerGroup>
      {cachedKeys.map((key, i) => {
        const tile = parseKey(key)
        if (!tile) return null
        return (
          <Rectangle
            key={i}
            bounds={tileBounds(tile.x, tile.y, tile.z)}
            pathOptions={{ color: '#22c55e', fillOpacity: 0.07, weight: 1.5 }}
          />
        )
      })}
    </LayerGroup>
  )
}
