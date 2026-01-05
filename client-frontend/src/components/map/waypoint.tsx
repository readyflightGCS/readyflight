import * as L from "leaflet"
import markerIconUrl from "@/assets/marker-icon.png"
import insertIconUrl from "@/assets/insert.png"

export const createAnimatedIcon = (isActive: boolean) =>
  L.divIcon({
    className: '',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    html: `
      <div style="
        transform: scale(${isActive ? 1.2 : 1});
        width: 25px;
        height: 41px;
        background-image: url('${markerIconUrl}');
        background-size: contain;
        background-repeat: no-repeat;
        position: relative;
        z-index: 10;
      "></div>
    `,
  });

export var insertIcon = L.icon({
  iconUrl: insertIconUrl,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
});

export var circleOverlayIcon = L.divIcon({
  className: "",
  iconSize: [20, 20],
  iconAnchor: [10, 10],
  html: `<div class="w-[20px] h-[20px] border-2 rounded-full"><div class="animate-ping w-[16px] h-[16px] border-2 rounded-full"></div></div>`
})

