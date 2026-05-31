import { Polyline } from 'react-leaflet'
import { worldOffset } from '@libs/world/distance'
import { interpolateLinear, rad2deg } from '@libs/math/geometry'
import type { LatLngExpression, PathOptions } from 'leaflet'
import type { Curve } from '@libs/dubins/types'
import type { LatLng } from '@libs/world/latlng'

export default function Arc({
  curve,
  pathOptions
}: {
  curve: Curve<LatLng>
  pathOptions?: PathOptions
}) {
  const points: LatLngExpression[] = []
  const steps = Math.round(Math.abs(curve.theta) * 10) + 1

  for (let i = 0; i <= steps; i++) {
    points.push(
      worldOffset(
        curve.center,
        curve.radius,
        rad2deg(interpolateLinear(curve.start, curve.start + curve.theta, i / steps))
      )
    )
  }
  return <Polyline pathOptions={pathOptions} positions={points} />
}
