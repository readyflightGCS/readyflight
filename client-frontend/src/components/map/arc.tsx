import { Polyline } from 'react-leaflet'
import { latLng, LatLngExpression, PathOptions } from 'leaflet'
import { worldOffset } from '@libs/world/distance'
import { Curve } from '@libs/dubins/types'
import { LatLng } from '@libs/world/latlng'
import { rad2deg } from '@libs/math/geometry'

export default function Arc({
  curve,
  pathOptions
}: {
  curve: Curve<LatLng>
  pathOptions?: PathOptions
}) {
  const points: LatLngExpression[] = []

  if (curve.theta < 0) {
    for (let i = 0; i > curve.theta; i -= 0.1) {
      const a = worldOffset(curve.center, curve.radius, rad2deg(curve.start + i))
      points.push(latLng(a.lat, a.lng))
    }
    const a = worldOffset(curve.center, curve.radius, rad2deg(curve.start + curve.theta))
    points.push(latLng(a.lat, a.lng))
  } else {
    for (let i = 0; i < curve.theta; i += 0.1) {
      const a = worldOffset(curve.center, curve.radius, rad2deg(curve.start + i))
      points.push(latLng(a.lat, a.lng))
    }
    const a = worldOffset(curve.center, curve.radius, rad2deg(curve.start + curve.theta))
    points.push(latLng(a.lat, a.lng))
  }

  return <Polyline pathOptions={pathOptions} positions={points} />
}
