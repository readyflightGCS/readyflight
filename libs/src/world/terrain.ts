import { getMany, setMany, createStore, entries, clear } from 'idb-keyval'
import { haversineDistance } from '@libs/world/distance'
import { LatLng, LatLngAlt } from '@libs/world/latlng'
import { interpolateLinear } from '@libs/math/geometry'

/**
 * Quantization resolution for terrain grid cells (decimal places).
 * 2 → 0.01° ≈ 1 km cells.
 */
const TERRAIN_RES = 2

const offset = 1 / 10 ** TERRAIN_RES

// One dedicated IDB object store so terrain data doesn't pollute the default store.
// Safe to call at module level — idb-keyval defers the actual DB open until first use.
// Exported so other modules (e.g. TerrainLayer) can reuse the same store instance.
export const terStore = createStore('readyflight-terrain', 'terrain-cache')

/**
 * Formats a lat/lng pair as the canonical cache key used throughout this module.
 */
function toKey(loc: LatLng): string {
  return `${Number(loc.lat.toFixed(TERRAIN_RES))},${Number(loc.lng.toFixed(TERRAIN_RES))}`
}

/**
 * Returns the four surrounding 0.01° grid corners for bilinear interpolation.
 */
function getSurroundingPoints(loc: LatLng): LatLng[] {
  const places = 10 ** TERRAIN_RES
  const latF = Math.floor(loc.lat * places) / places
  const lngF = Math.floor(loc.lng * places) / places
  return [
    { lat: latF,          lng: lngF          },
    { lat: latF,          lng: lngF + offset },
    { lat: latF + offset, lng: lngF          },
    { lat: latF + offset, lng: lngF + offset }
  ]
}

/**
 * Returns terrain elevations for every point in `locs`.
 *
 * Strategy:
 *  1. Expand each location to its four surrounding grid corners.
 *  2. Look up all corners in IndexedDB (cache-first).
 *  3. Fetch any missing corners from the open-elevation.com API and persist them.
 *  4. Bilinear-interpolate the four corners to get each original location's elevation.
 *
 * If the API is unreachable, points that have all four corners in cache are still
 * returned; points with incomplete coverage are silently omitted.
 */
export async function getTerrain(locs: LatLng[]): Promise<LatLngAlt[] | null> {
  if (locs.length === 0) return []

  // Collect all grid corners we need, deduplicated by key.
  const cornerKeySet = new Set<string>()
  locs.forEach(loc => getSurroundingPoints(loc).forEach(c => cornerKeySet.add(toKey(c))))

  const cornerKeys = Array.from(cornerKeySet)
  const cornerLocs: LatLng[] = cornerKeys.map(key => {
    const [a, b] = key.split(',').map(Number)
    return { lat: a, lng: b }
  })

  const { locs: cached, nf } = await getTerrainFromStorage(cornerLocs)
  console.log(`[ter] cached=${cached.length} missing=${nf.length}`)

  const elevation: LatLngAlt[] = [...cached]

  if (nf.length > 0) {
    const fetched = await fetchTerrain(nf)
    if (fetched !== null && fetched.length > 0) {
      elevation.push(...fetched)
      // Normalise keys to the same TERRAIN_RES format before caching so lookups always hit.
      await setMany(
        fetched.map(x => [toKey(x), x.alt] as [string, number]),
        terStore
      )
    }
    // If the API is unavailable we continue with whatever is cached — points whose
    // corners are incomplete will simply be omitted from the result below.
  }

  // Build a fast lookup map keyed by canonical string.
  const elevByKey = new Map<string, number>(elevation.map(e => [toKey(e), e.alt]))

  const result: LatLngAlt[] = []
  for (const loc of locs) {
    const corners = getSurroundingPoints(loc)
    const alts = corners.map(c => elevByKey.get(toKey(c)))
    if (alts.some(v => v === undefined)) continue  // incomplete coverage, skip

    const [a, b, c, d] = corners.map((corner, i) => ({ ...corner, alt: alts[i]! }))
    result.push({ ...loc, alt: Math.round(interpolateAlt(a, b, c, d, loc)) })
  }

  return result
}

/**
 * Looks up a batch of locations in the IndexedDB terrain cache.
 * Returns found elevations and the subset of locations not yet cached.
 */
export async function getTerrainFromStorage(locs: LatLng[]): Promise<{ locs: LatLngAlt[], nf: LatLng[] }> {
  if (locs.length === 0) return { locs: [], nf: [] }

  const keys = locs.map(toKey)
  const values = await getMany<number>(keys, terStore)

  const found: LatLngAlt[] = []
  const notFound: LatLng[] = []

  for (let i = 0; i < values.length; i++) {
    if (values[i] === undefined) {
      notFound.push(locs[i])
    } else {
      found.push({ ...locs[i], alt: values[i] })
    }
  }

  return { locs: found, nf: notFound }
}

/** Resolves after `ms` milliseconds, or immediately if `signal` fires first. */
function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    const id = setTimeout(resolve, ms)
    signal?.addEventListener('abort', () => { clearTimeout(id); resolve() }, { once: true })
  })
}

const RETRY_BACKOFF_MS = [1_000, 2_000, 4_000] as const

/**
 * Fetches terrain elevations from the open-elevation.com API using POST.
 * POST avoids URL-length limits for large batches.
 *
 * Retries up to 3 times with exponential back-off on rate-limit (429) or
 * transient network errors.  Non-retryable HTTP errors (e.g. 400, 404)
 * return null immediately.  Returns null if all retries are exhausted.
 */
export async function fetchTerrain(locs: LatLng[]): Promise<LatLngAlt[] | null> {
  if (locs.length === 0) return []

  for (let attempt = 0; attempt <= RETRY_BACKOFF_MS.length; attempt++) {
    let response: Response
    try {
      response = await fetch('https://api.open-elevation.com/api/v1/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          locations: locs.map(loc => ({ latitude: loc.lat, longitude: loc.lng }))
        })
      })
    } catch (networkError) {
      // Transient network failure — retry with back-off
      if (attempt < RETRY_BACKOFF_MS.length) {
        console.warn(`[TER] Network error, retrying in ${RETRY_BACKOFF_MS[attempt]}ms (attempt ${attempt + 1}):`, networkError)
        await sleep(RETRY_BACKOFF_MS[attempt])
        continue
      }
      console.warn('[TER] fetchTerrain: network error after all retries:', networkError)
      return null
    }

    if (response.status === 429) {
      if (attempt < RETRY_BACKOFF_MS.length) {
        console.warn(`[TER] Rate limited — retrying in ${RETRY_BACKOFF_MS[attempt]}ms (attempt ${attempt + 1})`)
        await sleep(RETRY_BACKOFF_MS[attempt])
        continue
      }
      console.warn('[TER] fetchTerrain: rate limit exceeded after all retries')
      return null
    }

    if (!response.ok) {
      console.warn(`[TER] fetchTerrain: HTTP ${response.status}`)
      return null  // Non-retryable error
    }

    try {
      const data: { results?: { elevation: number; latitude: number; longitude: number }[] } =
        await response.json()
      if (!data.results) throw new Error('No results field in response')
      return data.results.map(x => ({ alt: x.elevation, lat: x.latitude, lng: x.longitude }))
    } catch (parseError) {
      console.warn('[TER] fetchTerrain: failed to parse response:', parseError)
      return null
    }
  }

  return null
}

/**
 * Performs inverse-distance-weighted interpolation using four corner samples.
 * Falls back to exact corner value when the target coincides with a corner.
 */
export function interpolateAlt(a: LatLngAlt, b: LatLngAlt, c: LatLngAlt, d: LatLngAlt, target: LatLng): number {
  const dA = haversineDistance(target, a); if (dA === 0) return a.alt
  const dB = haversineDistance(target, b); if (dB === 0) return b.alt
  const dC = haversineDistance(target, c); if (dC === 0) return c.alt
  const dD = haversineDistance(target, d); if (dD === 0) return d.alt
  const wA = 1 / dA, wB = 1 / dB, wC = 1 / dC, wD = 1 / dD
  return (a.alt * wA + b.alt * wB + c.alt * wC + d.alt * wD) / (wA + wB + wC + wD)
}

/**
 * Linearly interpolates a position between two LatLng points.
 */
export function interpolateLatLng(a: LatLng, b: LatLng, fraction: number): LatLng {
  return {
    lat: interpolateLinear(a.lat, b.lat, fraction),
    lng: interpolateLinear(a.lng, b.lng, fraction)
  }
}

/**
 * Returns the altitude of the terrain data point closest to `point`.
 */
export function getTerrainElevationAtPoint(terrainData: LatLngAlt[], point: LatLng): number {
  if (!terrainData.length) return 0

  let closest = terrainData[0]
  let minDist = haversineDistance(point, terrainData[0])

  for (const tp of terrainData) {
    const d = haversineDistance(point, tp)
    if (d < minDist) { minDist = d; closest = tp }
  }

  return closest.alt
}

/**
 * Returns an array of cumulative distances (metres) for an ordered array of waypoints.
 * The first element is always 0.
 */
export function calculateCumulativeDistances(waypoints: LatLng[]): number[] {
  const distances: number[] = [0]
  let total = 0
  for (let i = 0; i < waypoints.length - 1; i++) {
    total += haversineDistance(waypoints[i], waypoints[i + 1])
    distances.push(total)
  }
  return distances
}

/**
 * Generates a dense sequence of LatLng points sampled evenly along a multi-segment path.
 */
export function generateInterpolatedPath(waypoints: LatLng[], totalDistance: number, numInterpolationPoints: number = 100): LatLng[] {
  if (waypoints.length === 0) return []

  const locations: LatLng[] = [waypoints[0]]
  const stepSize = totalDistance > 0 ? totalDistance / numInterpolationPoints : 0

  if (stepSize > 0) {
    for (let i = 0; i < waypoints.length - 1; i++) {
      const p1 = waypoints[i]
      const p2 = waypoints[i + 1]
      const segDist = haversineDistance(p1, p2)
      if (segDist > 0) {
        const intervals = Math.floor(segDist / stepSize)
        for (let j = 1; j < intervals; j++) {
          locations.push(interpolateLatLng(p1, p2, j / intervals))
        }
      }
      const last = locations[locations.length - 1]
      if (last.lat !== p2.lat || last.lng !== p2.lng) locations.push(p2)
    }
  } else {
    for (let i = 1; i < waypoints.length; i++) {
      const next = waypoints[i]
      const last = locations[locations.length - 1]
      if (last.lat !== next.lat || last.lng !== next.lng) locations.push(next)
    }
  }

  return locations
}

/**
 * Converts an AMSL / relative / terrain-relative altitude to a common
 * display-relative value (metres above the first waypoint's terrain elevation).
 */
export function adjustAltitudeForDisplay(
  altitude: number,
  frame: number,
  terrainElevation: number,
  baseTerrainElevation: number
): number {
  switch (frame) {
    case 0: return altitude - baseTerrainElevation        // AMSL → relative
    case 3: return altitude                               // Already relative
    case 10: return altitude + terrainElevation - baseTerrainElevation  // Terrain-relative → display-relative
    default: return altitude
  }
}

/**
 * Linearly interpolates altitudes along a series of waypoints by cumulative distance.
 */
export function interpolateAltitudes(
  waypoints: Array<{ lat: number; lng: number; altitude: number }>,
  startAltitude: number,
  endAltitude: number
): number[] {
  if (waypoints.length < 2) return []

  const distances = calculateCumulativeDistances(waypoints)
  const total = distances[distances.length - 1]

  if (total === 0) return waypoints.map(() => startAltitude)

  return distances.map(d => startAltitude + (endAltitude - startAltitude) * (d / total))
}

/**
 * Calculates interpolated altitudes for the waypoints between `startIndex` and
 * `endIndex` (exclusive), using the altitudes at those endpoints.
 */
export function calculateInterpolatedAltitudes(
  waypoints: Array<{ params: { latitude: number; longitude: number; altitude: number } }>,
  startIndex: number,
  endIndex: number
): { interpolatedAltitudes: number[]; totalDistance: number } {
  if (startIndex >= endIndex || startIndex < 0 || endIndex >= waypoints.length) {
    return { interpolatedAltitudes: [], totalDistance: 0 }
  }

  let totalDistance = 0
  for (let i = startIndex; i < endIndex; i++) {
    totalDistance += haversineDistance(
      { lat: waypoints[i].params.latitude, lng: waypoints[i].params.longitude },
      { lat: waypoints[i + 1].params.latitude, lng: waypoints[i + 1].params.longitude }
    )
  }

  const startAlt = waypoints[startIndex].params.altitude
  const endAlt = waypoints[endIndex].params.altitude

  const interpolatedAltitudes: number[] = []
  let cumDist = 0

  for (let i = startIndex + 1; i < endIndex; i++) {
    cumDist += haversineDistance(
      { lat: waypoints[i - 1].params.latitude, lng: waypoints[i - 1].params.longitude },
      { lat: waypoints[i].params.latitude, lng: waypoints[i].params.longitude }
    )
    const fraction = totalDistance > 0 ? cumDist / totalDistance : 0
    interpolatedAltitudes.push(startAlt + (endAlt - startAlt) * fraction)
  }

  return { interpolatedAltitudes, totalDistance }
}

// ─── Cache management ─────────────────────────────────────────────────────────

/**
 * Returns the number of grid cells currently in the terrain cache and a rough
 * storage estimate (each entry ≈ 20 bytes: ~12-char key + 8-byte number).
 */
export async function getTerrainCacheStats(): Promise<{ count: number; estimatedKb: number }> {
  const all = await entries(terStore)
  return {
    count: all.length,
    estimatedKb: Math.round(all.length * 20 / 1024)
  }
}

/**
 * Removes all terrain elevation data from the IndexedDB cache.
 */
export async function clearTerrainCache(): Promise<void> {
  await clear(terStore)
}

/**
 * Pre-populates the terrain cache for a circular area around `center`.
 *
 * Grid points are generated at the same 0.01° resolution used by the rest of the
 * terrain system, filtered to those within `radiusKm` kilometres.  Points already
 * in the cache are skipped; the remainder are fetched from the open-elevation API
 * in batches of 100 and stored.
 *
 * @param center     Centre of the download area.
 * @param radiusKm   Download radius in kilometres.
 * @param onProgress Called after each batch with (done, total) counts.
 * @param signal     Optional AbortSignal to cancel mid-download.
 * @returns          Counts of newly downloaded and already-cached cells.
 */
export async function downloadTerrainForArea(
  center: LatLng,
  radiusKm: number,
  onProgress: (done: number, total: number) => void,
  signal?: AbortSignal
): Promise<{ downloaded: number; skipped: number }> {
  const STEP = offset                                                   // 0.01°
  const latRange = radiusKm / 111.32
  const lngRange = radiusKm / (111.32 * Math.cos((center.lat * Math.PI) / 180))

  // Generate every 0.01° grid point within the circle.
  const points: LatLng[] = []
  for (let dlat = -latRange; dlat <= latRange + STEP / 2; dlat += STEP) {
    for (let dlng = -lngRange; dlng <= lngRange + STEP / 2; dlng += STEP) {
      const pt: LatLng = {
        lat: Number((center.lat + dlat).toFixed(TERRAIN_RES)),
        lng: Number((center.lng + dlng).toFixed(TERRAIN_RES))
      }
      if (haversineDistance(center, pt) <= radiusKm * 1000) {
        points.push(pt)
      }
    }
  }

  const total = points.length
  if (total === 0) return { downloaded: 0, skipped: 0 }

  // Partition into already-cached and missing.
  const keys = points.map(toKey)
  const cached = await getMany<number>(keys, terStore)

  const missing: LatLng[] = []
  let done = 0

  for (let i = 0; i < points.length; i++) {
    if (cached[i] !== undefined) done++
    else missing.push(points[i])
  }

  onProgress(done, total)

  const BATCH = 100
  const BATCH_DELAY_MS = 300  // breathing room between API requests
  let downloaded = 0
  const skipped = done

  for (let i = 0; i < missing.length; i += BATCH) {
    if (signal?.aborted) break

    // Polite inter-batch delay — skipped for the very first batch.
    if (i > 0) await sleep(BATCH_DELAY_MS, signal)
    if (signal?.aborted) break

    const batch = missing.slice(i, i + BATCH)
    const fetched = await fetchTerrain(batch)

    if (fetched && fetched.length > 0) {
      await setMany(
        fetched.map(x => [toKey(x), x.alt] as [string, number]),
        terStore
      )
      downloaded += fetched.length
    }

    done += batch.length
    onProgress(done, total)
  }

  return { downloaded, skipped }
}
