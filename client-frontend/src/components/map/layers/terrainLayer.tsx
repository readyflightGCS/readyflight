import { entries } from 'idb-keyval'
import { useEffect, useState } from 'react'
import { Circle, LayerGroup } from 'react-leaflet'
import { useRFMap } from '@libs/stores/map'
import { LatLngAlt } from '@libs/world/latlng'
import { terStore } from '@libs/world/terrain'

export default function TerrainLayer() {
  const viewable = useRFMap((s) => s.viewable)
  const terrainPreview = useRFMap((s) => s.terrainPreview)
  const [terrainData, setTerrainData] = useState<LatLngAlt[]>([])

  useEffect(() => {
    if (!viewable.terrain) return
    entries(terStore).then((data) => {
      setTerrainData(
        data.map((x) => {
          const [a, b] = String(x[0]).split(',').map(Number)
          return { lat: a, lng: b, alt: x[1] as number }
        })
      )
    })
  }, [viewable.terrain])

  // Nothing to render
  if (!viewable.terrain && !terrainPreview) return null

  return (
    <LayerGroup>
      {/* Cached terrain grid cells */}
      {viewable.terrain &&
        terrainData.map((x, i) => (
          <Circle
            key={i}
            center={[x.lat, x.lng]}
            radius={500}
            pathOptions={{ color: '#228B22', fillOpacity: 0.3, weight: 1 }}
          />
        ))}

      {/* Download area preview — always visible when set */}
      {terrainPreview && (
        <Circle
          center={[terrainPreview.lat, terrainPreview.lng]}
          radius={terrainPreview.radiusKm * 1000}
          pathOptions={{
            color: '#3b82f6',
            fillOpacity: 0.07,
            weight: 2,
            dashArray: '8 5'
          }}
        />
      )}
    </LayerGroup>
  )
}
