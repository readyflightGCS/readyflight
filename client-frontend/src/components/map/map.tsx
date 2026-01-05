import * as React from "react";
import { MapContainer, TileLayer, useMapEvent } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

import { useMapClickHandler } from "@/hooks/useMapClickHandler";
import MissionLayer from "./layers/mission";
import GeofenceLayer from "./layers/geofenceLayer";
import MarkerLayer from "./layers/markerLayer";

function Map(): React.JSX.Element {
  const handleMapClick = useMapClickHandler();

  function CreateHandler() {
    useMapEvent("click", (e) => {
      handleMapClick(e);
    });
    return null;
  }


  return (
    <MapContainer
      className="absolute inset-0 z-10"
      center={[55.95, -3.183333]}
      zoom={13} >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <CreateHandler />
      <MissionLayer />
      <GeofenceLayer />
      <MarkerLayer />
    </MapContainer>
  )
}

export default Map;
