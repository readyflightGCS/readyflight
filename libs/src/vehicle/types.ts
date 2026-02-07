/**
 * A rotary‑wing vehicle with no additional performance parameters.
 *
 * @remarks
 * This is the minimal shape required to represent a copter‑type vehicle in the system.
 * It serves as one branch of the {@link Vehicle} discriminated union.
 */
export type Copter = {
  type: "Copter"

}

/**
 * A fixed‑wing aircraft definition with the parameters required for
 * motion, energy, and manoeuvre modelling.
 *
 * @remarks
 * The `type` field acts as the discriminant for the {@link Vehicle} union.
 *
 * @property cruiseAirspeed Nominal cruise speed used for baseline kinematic calculations.
 * @property maxBank Maximum permitted bank angle in degrees.
 * @property energyConstant Scalar used in energy‑based manoeuvre and performance modelling.
 */
export type Plane = {
  type: "Plane"
  cruiseAirspeed: number
  maxBank: number
  energyConstant: number
}

/**
 * A discriminated union representing any supported vehicle type.
 *
 * @remarks
 * The `type` field on each member (`"Copter"` or `"Plane"`) enables
 * safe narrowing and exhaustive handling in control logic.
 */
export type Vehicle = Copter | Plane


