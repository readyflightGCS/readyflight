import * as React from 'react'
import { useEffect } from 'react'
import { MapContainer, TileLayer, useMap, useMapEvent } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { useMapClickHandler } from '@/hooks/useMapClickHandler'
import MissionLayer from './layers/mission'
import GeofenceLayer from './layers/geofenceLayer'
import MarkerLayer from './layers/markerLayer'
import DubinsLayer from './layers/dubinsLayer'
import TerrainLayer from './layers/terrainLayer'
import { useRFMap } from '@libs/stores/map'
import { useEditor } from '@libs/stores/configurator'

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

function Map(): React.JSX.Element {
  return (
    <MapContainer
      className="absolute inset-0 z-10"
      center={[55.95, -3.183333]}
      zoom={13}
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapRefSetter />
      <TerrainPickCursor />
      <CreateHandler />
      <MissionLayer />
      <GeofenceLayer />
      <MarkerLayer />
      <DubinsLayer />
      <TerrainLayer />
    </MapContainer>
  )
}

export default Map
