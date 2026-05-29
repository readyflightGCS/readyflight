import { MutableRefObject } from 'react'
import { Map } from 'leaflet'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export const mapElements = [
  'markers',
  'geofence',
  'loiter radius',
  'accept radius',
  'terrain',
  'tile cache',
  'imagery'
] as const

export type TerrainPreview = { lat: number; lng: number; radiusKm: number }

type MapContextState = {
  mapRef: MutableRefObject<Map> | null
  tileProvider: { subdomains: string[]; url: string }
  setTileProvider: (x: { subdomains: string[]; url: string }) => void
  viewable: { [K in (typeof mapElements)[number]]: boolean }
  setViewable: (x: { [K in (typeof mapElements)[number]]: boolean }) => void
  /** Circle preview shown on the map while configuring a terrain download. */
  terrainPreview: TerrainPreview | null
  setTerrainPreview: (x: TerrainPreview | null) => void
}

export const DEFAULT_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'

export const useRFMap = create<MapContextState>()(
  persist(
    (set) => ({
      mapRef: null,
      tileProvider: {
        url: DEFAULT_TILE_URL,
        subdomains: ['a', 'b', 'c']
      },
      setTileProvider: (x) => set({ tileProvider: x }),
      viewable: {
        markers: true,
        geofence: true,
        'loiter radius': true,
        'accept radius': false,
        terrain: false,
        'tile cache': false,
        imagery: false
      },
      setViewable: (x) => set({ viewable: x }),
      terrainPreview: null,
      setTerrainPreview: (x) => set({ terrainPreview: x }),
    }),
    {
      name: 'map-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ tileProvider: state.tileProvider }),
    }
  )
)
