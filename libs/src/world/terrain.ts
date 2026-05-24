import { getMany, setMany, createStore } from 'idb-keyval'
import { haversineDistance } from "@libs/world/distance";
import { LatLng, LatLngAlt } from "@libs/world/latlng";
import { interpolateLinear } from '@libs/math/geometry';

/**
 * Quantization resolution for terrain grid cells (decimal places).
 * 2 → 0.01° ≈ 1 km cells.
 */
const TERRAIN_RES = 2

const offset = 1 / 10 ** TERRAIN_RES

// One dedicated IDB object store so terrain data doesn't pollute the default store.
// Safe to call at module level — idb-keyval defers the actual DB open until first use.
const terStore = createStore('readyflight-terrain', 'terrain-cache')

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
  const latF = Number(loc.lat.toFixed(TERRAIN_RES))
  const lngF = Number(loc.lng.toFixed(TERRAIN_RES))
  return [
    { lat: latF, lng: lngF },
    { lat: latF, lng: Number((loc.lng + offset).toFixed(TERRAIN_RES)) },
    { lat: Number((loc.lat + offset).toFixed(TERRAIN_RES)), lng: lngF },
    { lat: Number((loc.lat + offset).toFixed(TERRAIN_RES)), lng: Number((loc.lng + offset).toFixed(TERRAIN_RES)) }
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

/**
 * Fetches terrain elevations from the open-elevation.com API using POST.
 * POST avoids URL-length limits for large batches.
 * Returns null on network / API error (caller should degrade gracefully).
 */
export async function fetchTerrain(locs: LatLng[]): Promise<LatLngAlt[] | null> {
  if (locs.length === 0) return []

  return fetch('https://api.open-elevation.com/api/v1/lookup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({
      locations: locs.map(loc => ({ latitude: loc.lat, longitude: loc.lng }))
    })
  })
    .then(response => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      return response.json()
    })
    .then((data: { results?: { elevation: number; latitude: number; longitude: number }[] }) => {
      if (!data.results) throw new Error('No results field in response')
      return data.results.map(x => ({
        alt: x.elevation,
        lat: x.latitude,
        lng: x.longitude
      } as LatLngAlt))
    })
    .catch(error => {
      console.warn('[TER] fetchTerrain failed:', error)
      return null
    })
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
