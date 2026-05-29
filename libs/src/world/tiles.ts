import { get, set, clear, keys, createStore, getMany } from 'idb-keyval'

export const tileStore = createStore('readyflight-tiles', 'tile-cache')

/** Cache key that is stable regardless of which subdomain was picked. */
export function tileKey(urlTemplate: string, z: number, x: number, y: number): string {
  return `${urlTemplate}::${z}::${x}::${y}`
}

export async function getCachedTile(key: string): Promise<Blob | undefined> {
  return get<Blob>(key, tileStore)
}

export async function setCachedTile(key: string, blob: Blob): Promise<void> {
  return set(key, blob, tileStore)
}

export async function getTileCacheStats(): Promise<{ count: number; estimatedKb: number }> {
  const allKeys = await keys(tileStore)
  // Tiles vary a lot; 30 KB is a reasonable average for typical map tiles.
  return { count: allKeys.length, estimatedKb: Math.round(allKeys.length * 30) }
}

export async function clearTileCache(): Promise<void> {
  return clear(tileStore)
}

/** Returns all keys currently in the tile cache as strings. */
export async function getAllTileKeys(): Promise<string[]> {
  const allKeys = await keys(tileStore)
  return allKeys.map(String)
}

// ─── Tile coordinate helpers ──────────────────────────────────────────────────

function latLngToTile(lat: number, lng: number, z: number): { x: number; y: number } {
  const n = 2 ** z
  const x = Math.floor(((lng + 180) / 360) * n)
  const latRad = (lat * Math.PI) / 180
  const y = Math.floor(
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n
  )
  return { x: Math.max(0, Math.min(n - 1, x)), y: Math.max(0, Math.min(n - 1, y)) }
}

function tileCenter(x: number, y: number, z: number): { lat: number; lng: number } {
  const n = 2 ** z
  const lng = ((x + 0.5) / n) * 360 - 180
  const latRad = Math.atan(Math.sinh(Math.PI * (1 - (2 * (y + 0.5)) / n)))
  return { lat: (latRad * 180) / Math.PI, lng }
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return R * 2 * Math.asin(Math.sqrt(a))
}

function resolveUrl(
  urlTemplate: string,
  subdomains: string[],
  z: number,
  x: number,
  y: number
): string {
  const s = subdomains.length > 0 ? subdomains[x % subdomains.length] : ''
  return urlTemplate
    .replace('{z}', String(z))
    .replace('{x}', String(x))
    .replace('{y}', String(y))
    .replace('{s}', s)
    .replace('{r}', '')
}

/**
 * Estimates the number of tiles inside the circle across a zoom range.
 * Falls back to a π/4 area approximation for very large grids to stay fast.
 */
export function estimateTileCount(
  lat: number,
  lng: number,
  radiusKm: number,
  minZoom: number,
  maxZoom: number
): number {
  let total = 0
  const latDelta = radiusKm / 111.32
  const lngDelta = radiusKm / (111.32 * Math.cos((lat * Math.PI) / 180))

  for (let z = minZoom; z <= maxZoom; z++) {
    const nw = latLngToTile(lat + latDelta, lng - lngDelta, z)
    const se = latLngToTile(lat - latDelta, lng + lngDelta, z)
    const w = se.x - nw.x + 1
    const h = se.y - nw.y + 1

    if (w * h > 50_000) {
      // Fast circle-area approximation for large bounding boxes
      total += Math.round((Math.PI / 4) * w * h)
      continue
    }

    for (let x = nw.x; x <= se.x; x++) {
      for (let y = nw.y; y <= se.y; y++) {
        const c = tileCenter(x, y, z)
        if (haversineKm(lat, lng, c.lat, c.lng) <= radiusKm) total++
      }
    }
  }
  return total
}

/**
 * Pre-populates the tile cache for a circular area.
 * Tiles already cached are skipped. Downloads run with bounded concurrency.
 */
export async function downloadTilesForArea(
  lat: number,
  lng: number,
  radiusKm: number,
  minZoom: number,
  maxZoom: number,
  urlTemplate: string,
  subdomains: string[],
  onProgress: (done: number, total: number) => void,
  signal: AbortSignal
): Promise<{ downloaded: number; skipped: number }> {
  const latDelta = radiusKm / 111.32
  const lngDelta = radiusKm / (111.32 * Math.cos((lat * Math.PI) / 180))

  const tiles: { z: number; x: number; y: number }[] = []
  for (let z = minZoom; z <= maxZoom; z++) {
    const nw = latLngToTile(lat + latDelta, lng - lngDelta, z)
    const se = latLngToTile(lat - latDelta, lng + lngDelta, z)
    for (let x = nw.x; x <= se.x; x++) {
      for (let y = nw.y; y <= se.y; y++) {
        const c = tileCenter(x, y, z)
        if (haversineKm(lat, lng, c.lat, c.lng) <= radiusKm) tiles.push({ z, x, y })
      }
    }
  }

  const total = tiles.length
  if (total === 0) return { downloaded: 0, skipped: 0 }

  const cacheKeys = tiles.map(({ z, x, y }) => tileKey(urlTemplate, z, x, y))
  const cached = await getMany(cacheKeys, tileStore)

  const missing = tiles.filter((_, i) => cached[i] === undefined)
  const skipped = total - missing.length
  let done = skipped
  let downloaded = 0

  onProgress(done, total)

  const CONCURRENCY = 4
  let idx = 0

  async function worker(): Promise<void> {
    while (idx < missing.length) {
      if (signal.aborted) return
      const tile = missing[idx++]
      const url = resolveUrl(urlTemplate, subdomains, tile.z, tile.x, tile.y)
      const key = tileKey(urlTemplate, tile.z, tile.x, tile.y)
      try {
        const response = await fetch(url, { signal })
        if (response.ok) {
          const blob = await response.blob()
          await set(key, blob, tileStore)
          downloaded++
        }
      } catch {
        if (signal.aborted) return
      }
      done++
      onProgress(done, total)
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker))
  return { downloaded, skipped }
}
