import { createStore, entries } from 'idb-keyval'
import { useEffect, useState } from 'react'
import { Circle, LayerGroup } from 'react-leaflet'
import { useRFMap } from '@libs/stores/map'
import { LatLngAlt } from '@libs/world/latlng'

const terStore = createStore('readyflight-terrain', 'terrain-cache')

export default function TerrainLayer() {
  const viewable = useRFMap((s) => s.viewable)
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

  if (!viewable.terrain) return null

  return (
    <LayerGroup>
      {terrainData.map((x, i) => (
        <Circle
          key={i}
          center={[x.lat, x.lng]}
          radius={500}
          pathOptions={{ color: '#228B22', fillOpacity: 0.3, weight: 1 }}
        />
      ))}
    </LayerGroup>
  )
}
