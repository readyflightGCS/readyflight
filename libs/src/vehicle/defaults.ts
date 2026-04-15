/**
 * Default aircraft presets used when no custom configuration is supplied.
 *
 * @remarks
 * These constants provide minimal, ready‑to‑use baseline values for the two
 * supported vehicle types in the module: {@link Plane} and {@link Copter}.
 * They are useful for simulations, tests, or UI defaults where a fully
 * specified object is required.
 *
 * @packageDocumentation
 */

import { Copter, Plane } from "./types"

/**
 * Baseline configuration for a fixed‑wing aircraft.
 *
 * @constant
 * @type {Plane}
 * @property type Identifies the vehicle as a `"Plane"`.
 * @property cruiseAirspeed Nominal cruise speed used for energy and motion modelling.
 * @property maxBank Maximum allowed bank angle in degrees.
 * @property energyConstant Scalar used in energy‑based manoeuvre calculations.
 */
export const defaultPlane: Plane = {
  type: "Plane",
  cruiseAirspeed: 17,
  maxBank: 30,
  energyConstant: 17
}

/**
 * Baseline configuration for a rotary‑wing aircraft.
 *
 * @constant
 * @type {Copter}
 * @property type Identifies the vehicle as a `"Copter"`.
 */
export const defaultCopter: Copter = {
  type: "Copter",
}
