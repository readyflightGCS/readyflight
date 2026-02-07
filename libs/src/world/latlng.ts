
import { CommandDescription, MissionCommand } from "@libs/commands/command"

/**
 * A geographic coordinate expressed in latitude and longitude.
 *
 * @remarks
 * Latitude (`lat`) represents the north–south axis (Y‑axis), and longitude (`lng`)
 * represents the east–west axis (X‑axis). This type is used throughout navigation,
 * mapping, and mission‑planning utilities.
 */
export type LatLng = {
  lat: number, // the Y axis
  lng: number // the X axis
}

/**
 * A geographic coordinate including altitude above mean sea level.
 *
 * @remarks
 * Extends {@link LatLng} with an `alt` component for 3‑D positioning. Useful for
 * flight‑path calculations, terrain‑relative operations, and mission commands
 * that require vertical separation.
 */
export type LatLngAlt = {
  lat: number,
  lng: number,
  alt: number
}

/**
 * Compare two geographic positions for exact equality.
 *
 * @remarks
 * Only latitude and longitude are compared. Altitude is ignored, and no
 * normalization or wrap‑around logic is applied for longitudes crossing ±180°.
 * This is a strict numeric comparison intended for lightweight equality checks.
 *
 * @param pos1 First position to compare
 * @param pos2 Second position to compare
 * @returns `true` if both latitude and longitude match exactly
 */

export function latLngEqual(pos1: LatLng | LatLngAlt, pos2: LatLng | LatLngAlt): boolean {
  return pos1.lat == pos2.lat && pos1.lng == pos2.lng
}

// Terrain Altitudes

/**
 * Convert a mission command’s altitude to absolute altitude above mean sea level (AMSL).
 *
 * @remarks
 * The returned value depends on the command’s altitude frame:
 *
 * - `0` — altitude is already AMSL  
 * - `2` — non‑destination frame; altitude is undefined  
 * - `3` — altitude is relative to a reference altitude  
 * - `10` — altitude is relative to terrain elevation  
 *
 * If the command does not contain an `altitude` parameter, `undefined` is returned.
 *
 * @param cmd Mission command containing altitude and frame information
 * @param referenceAlt Reference altitude used for frame‑3 conversions
 * @param terrainAlt Terrain elevation used for frame‑10 conversions
 * @returns AMSL altitude or `undefined` if not applicable
 */

export function getAltAMSL(cmd: MissionCommand<CommandDescription>, referenceAlt: number, terrainAlt: number): number | undefined {
  if ("altitude" in cmd.params) {
    switch (cmd.frame) {
      case 0: // MSL
        return cmd.params.altitude as number
      case 2: // non destination
        return undefined
      case 3: // relative to reference
        return cmd.params.altitude as number + referenceAlt
      case 10: //relative to terrain
        return cmd.params.altitude as number + terrainAlt
    }
  }
  else return undefined
}


/**
 * Convert a mission command’s altitude to a value relative to terrain elevation.
 *
 * @remarks
 * The returned value depends on the command’s altitude frame:
 *
 * - `0` — AMSL altitude minus terrain elevation  
 * - `2` — non‑destination frame; altitude is undefined  
 * - `3` — reference‑relative altitude adjusted by reference and terrain  
 * - `10` — altitude is already terrain‑relative  
 *
 * @param cmd Mission command containing altitude and frame information
 * @param referenceAlt Reference altitude used for frame‑3 conversions
 * @param terrainAlt Terrain elevation used for frame‑0 and frame‑3 conversions
 * @returns Terrain‑relative altitude or `undefined` if not applicable
 */
export function getAltTer(cmd: MissionCommand<CommandDescription>, referenceAlt: number, terrainAlt: number): number | undefined {
  if ("altitude" in cmd.params) {
    switch (cmd.frame) {
      case 0: // MSL
        return cmd.params.altitude as number - terrainAlt
      case 2: // non destination
        return undefined
      case 3: // relative to reference
        return cmd.params.altitude as number + referenceAlt - terrainAlt
      case 10: //relative to terrain
        return cmd.params.altitude as number
    }
  }
  else return undefined
}

/**
 * Convert a mission command’s altitude to a value relative to a reference altitude.
 *
 * @remarks
 * The returned value depends on the command’s altitude frame:
 *
 * - `0` — AMSL altitude minus reference altitude  
 * - `2` — non‑destination frame; altitude is undefined  
 * - `3` — altitude is already reference‑relative  
 * - `10` — terrain‑relative altitude adjusted by terrain and reference  
 *
 * @param cmd Mission command containing altitude and frame information
 * @param referenceAlt Reference altitude used for frame‑0 and frame‑10 conversions
 * @param terrainAlt Terrain elevation used for frame‑10 conversions
 * @returns Reference‑relative altitude or `undefined` if not applicable
 */
export function getAltRel(cmd: MissionCommand<CommandDescription>, referenceAlt: number, terrainAlt: number): number | undefined {
  if ("altitude" in cmd.params) {
    switch (cmd.frame) {
      case 0: // MSL
        return cmd.params.altitude as number - referenceAlt
      case 2: // non destination
        return undefined
      case 3: // relative to reference
        return cmd.params.altitude as number
      case 10: //relative to terrain
        return cmd.params.altitude as number + terrainAlt - referenceAlt
    }
  }
  else return undefined
}


/**
 * Compute the average latitude and longitude of a set of positions.
 *
 * @remarks
 * Returns `undefined` for an empty array. Otherwise, computes the arithmetic mean
 * of all latitudes and longitudes independently. This is a simple centroid
 * approximation suitable for small geographic areas where spherical distortion
 * is negligible.
 *
 * @param locs Array of positions to average
 * @returns A new {@link LatLng} representing the average position, or `undefined`
 */
export const avgLatLng = (locs: LatLng[]): LatLng | undefined => {
  if (locs.length == 0) return undefined
  let totLat = 0;
  let totLng = 0;
  locs.forEach((loc) => {
    totLat += loc.lat;
    totLng += loc.lng;
  })
  return { lat: totLat / locs.length, lng: totLng / locs.length }
}
