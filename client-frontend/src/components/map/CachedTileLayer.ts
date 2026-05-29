import * as L from 'leaflet'
import { getCachedTile, setCachedTile, tileKey } from '@libs/world/tiles'

/**
 * A Leaflet TileLayer that checks an IndexedDB cache before making network
 * requests. On a cache miss the tile is fetched, stored as a Blob, and served
 * via an object URL so that subsequent loads are instant.
 *
 * Falls back to a plain `img.src` assignment when:
 *  - IndexedDB is unavailable
 *  - The fetch fails (network error, CORS restriction, etc.)
 * In the fallback path the tile is displayed but not cached.
 */
export class CachedTileLayer extends L.TileLayer {
  // Store the template separately so we never need to touch Leaflet internals.
  private _template: string

  constructor(urlTemplate: string, options?: L.TileLayerOptions) {
    super(urlTemplate, options)
    this._template = urlTemplate
  }

  setUrl(url: string, noRedraw?: boolean): this {
    this._template = url
    return super.setUrl(url, noRedraw)
  }

  createTile(coords: L.Coords, done: L.DoneCallback): HTMLElement {
    const img = document.createElement('img')
    img.alt = ''

    // Leaflet calls done() from within load/error handlers.
    img.addEventListener('load', () => done(undefined, img), { once: true })
    img.addEventListener('error', () => done(new Error('tile load failed'), img), { once: true })

    const key = tileKey(this._template, coords.z, coords.x, coords.y)
    const directUrl = this.getTileUrl(coords)

    getCachedTile(key)
      .then((cached) => {
        if (cached) {
          const objUrl = URL.createObjectURL(cached)
          const revoke = () => URL.revokeObjectURL(objUrl)
          img.addEventListener('load', revoke, { once: true })
          img.addEventListener('error', revoke, { once: true })
          img.src = objUrl
        } else {
          fetch(directUrl)
            .then((r) => {
              if (!r.ok) throw new Error(`HTTP ${r.status}`)
              return r.blob()
            })
            .then((blob) => {
              // Write to cache in the background — don't block tile display.
              setCachedTile(key, blob)
              const objUrl = URL.createObjectURL(blob)
              const revoke = () => URL.revokeObjectURL(objUrl)
              img.addEventListener('load', revoke, { once: true })
              img.addEventListener('error', revoke, { once: true })
              img.src = objUrl
            })
            .catch(() => {
              // fetch failed (offline, CORS, etc.) — degrade to direct URL load
              img.src = directUrl
            })
        }
      })
      .catch(() => {
        // IndexedDB unavailable — degrade gracefully
        img.src = directUrl
      })

    return img
  }
}
