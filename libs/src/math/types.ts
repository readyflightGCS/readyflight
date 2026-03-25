/**
 * A 2‑D Cartesian coordinate used for planar geometry, local ENU calculations,
 * and polygon operations such as point‑in‑polygon tests.
 *
 * @remarks
 * The `x` component represents the east–west axis, and the `y` component
 * represents the north–south axis. This type is used throughout local‑frame
 * navigation, interpolation, and geometric algorithms where positions are
 * expressed in meters rather than latitude/longitude.
 */
export type XY = {
  x: number,
  y: number
}
