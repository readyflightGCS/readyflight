import * as React from 'react'
import { useEffect } from 'react'
import { MapContainer, useMap, useMapEvent } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { useMapClickHandler } from '@/hooks/useMapClickHandler'
import MissionLayer from './layers/mission'
import GeofenceLayer from './layers/geofenceLayer'
import MarkerLayer from './layers/markerLayer'
import DubinsLayer from './layers/dubinsLayer'
import TerrainLayer from './layers/terrainLayer'
import TileCacheLayer from './layers/tileCacheLayer'
import { useRFMap, DEFAULT_TILE_URL } from '@libs/stores/map'
import { useEditor } from '@libs/stores/configurator'
import { CachedTileLayer } from './CachedTileLayer'

function CreateHandler() {
  const handleMapClick = useMapClickHandler()
  useMapEvent('click', (e) => {
    handleMapClick(e)
  })
  return null
}

function MapRefSetter() {
  const map = useMap()
  useEffect(() => {
    useRFMap.setState({ mapRef: { current: map } })
  }, [map])
  return null
}

function TerrainPickCursor() {
  const pickMode = useEditor((s) => s.tool === 'selectCache')
  const map = useMap()
  useEffect(() => {
    map.getContainer().style.cursor = pickMode ? 'crosshair' : ''
  }, [pickMode, map])
  return null
}

/**
 * Mounts a CachedTileLayer on the Leaflet map and remounts it whenever the
 * tile provider URL changes, which discards all loaded tiles and forces a
 * fresh fetch from the new provider.
 */
function TileLayerManager() {
  const map = useMap()
  const { tileProvider } = useRFMap()

  const subdomainsKey = tileProvider.subdomains.join(',')
  useEffect(() => {
    const attribution =
      tileProvider.url === DEFAULT_TILE_URL
        ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        : ''
    const layer = new CachedTileLayer(tileProvider.url, {
      subdomains: tileProvider.subdomains,
      attribution
    })
    layer.addTo(map)
    return () => {
      map.removeLayer(layer)
    }
    // subdomainsKey serialises the array so the dep comparison is value-based
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tileProvider.url, subdomainsKey, map])

  return null
}

function Map(): React.JSX.Element {
  return (
    <MapContainer
      className="absolute inset-0 z-10"
      center={[55.95, -3.183333]}
      zoom={13}
      zoomControl={false}
    >
      <TileLayerManager />
      <MapRefSetter />
      <TerrainPickCursor />
      <CreateHandler />
      <MissionLayer />
      <GeofenceLayer />
      <MarkerLayer />
      <DubinsLayer />
      <TerrainLayer />
      <TileCacheLayer />
    </MapContainer>
  )
}

export default Map
