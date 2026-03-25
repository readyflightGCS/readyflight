import { XY } from "@libs/math/types"
import { LatLng } from "@libs/world/latlng"

/**
 * Represents a bound constraint with minimum and maximum values.
 * @typedef {Object} bound
 * @property {number} [min] - The minimum value of the bound (optional).
 * @property {number} [max] - The maximum value of the bound (optional).
 * @property {boolean} [circular] - Indicates whether the bound wraps around circularly (optional).
 */
export type bound = {
  min?: number,
  max?: number,
  circular?: boolean
}

/**
 * Represents a point in a Dubins path with configuration parameters.
 * @typedef {Object} dubinsPoint
 * @property {boolean} tunable - Whether this point's parameters can be adjusted
 * @property {XY} pos - The x,y coordinates of the point
 * @property {number} radius - The turning radius at this point
 * @property {bound} bounds - The boundary constraints for this point
 * @property {number} heading - The direction of travel in degrees
 * @property {number} passbyRadius - The radius for passing near this point
 */
export type dubinsPoint = {
  tunable: boolean,
  pos: XY,
  radius: number,
  bounds: bound,
  heading: number // degrees
  passbyRadius: number
}

/**
 * Represents a Dubins curve segment.
 * @template S - The coordinate system type (XY or LatLng). Defaults to XY | LatLng.
 * @property {string} type - The literal string "Curve" identifying this as a curve segment.
 * @property {S} center - The center point of the circular arc in the specified coordinate system.
 * @property {number} radius - The radius of the circular arc.
 * @property {number} start - The starting angle of the arc in radians.
 * @property {number} theta - The angular span of the arc in radians.
 */
export type Curve<S = XY | LatLng> = {
  type: "Curve"
  center: S,
  radius: number,
  start: number, // Radians
  theta: number // Radians
}

/**
 * Represents a straight line segment path between two points.
 * @template S - The coordinate system type, either XY (Cartesian) or LatLng (geographic). Defaults to XY | LatLng.
 * @property {string} type - The type identifier, always set to "Straight".
 * @property {S} start - The starting point of the straight line segment.
 * @property {S} end - The ending point of the straight line segment.
 */
export type Straight<S = XY | LatLng> = {
  type: "Straight"
  start: S,
  end: S
}

/**
 * Represents a path segment in a Dubins curve, which can be either a curved arc or a straight line.
 * @template S - The coordinate system type, either Cartesian (XY) or geographic (LatLng). Defaults to XY | LatLng.
 */
export type Segment<S = XY | LatLng> = Curve<S> | Straight<S>

/**
 * Represents a Dubins path consisting of two circular turns and a straight line segment.
 * This is a common path type in trajectory planning for vehicles with bounded curvature.
 * 
 * @template S - The coordinate system type. Defaults to either Cartesian (XY) or geographic (LatLng) coordinates.
 * 
 * @property {Curve<S>} turnA - The initial circular turn segment.
 * @property {Straight<S>} straight - The straight line segment connecting the two turns.
 * @property {Curve<S>} turnB - The final circular turn segment.
 */
export type DubinsPath<S = XY | LatLng> = {
  turnA: Curve<S>
  straight: Straight<S>
  turnB: Curve<S>
}

/**
 * Represents a Dubins path as a sequence of segments.
 * @template S - The coordinate system type, either Cartesian (XY) or geographic (LatLng). Defaults to XY | LatLng.
 */
export type Path<S = XY | LatLng> = Segment<S>[]