// import { Command, LatLngAltCommand, LatLngCommand } from "@libs/commands/commands";

import { Command } from "@libs/commands/command"

export type LatLng = {
  lat: number, // the Y axis
  lng: number // the X axis
}

export type LatLngAlt = {
  lat: number,
  lng: number,
  alt: number
}

/*
 * Check if two positions are equal, doesn't check modulo around the earth; possible TODO
 * @param {LatLng} pos1 - the first position
 * @param {LatLng} pos2 - the second position
 * @returns {boolean} - If the positions are equal
 */
export function latLngEqual(pos1: LatLng | LatLngAlt, pos2: LatLng | LatLngAlt): boolean {
  return pos1.lat == pos2.lat && pos1.lng == pos2.lng
}

// Terrain Altiotudes

// covret the command's altitude to amsl
export function getAltAMSL(cmd: Command, referenceAlt: number, terrainAlt: number): number | undefined {
  if ("altitude" in cmd.params) {
    switch (cmd.frame) {
      case 0: // MSL
        return cmd.params.altitude
      case 2: // non destination
        return undefined
      case 3: // relative to reference
        return cmd.params.altitude + referenceAlt
      case 10: //relative to terrain
        return cmd.params.altitude + terrainAlt
    }
  }
  else return undefined
}

// convert the command's altitude to relative to terrain
export function getAltTer(cmd: Command, referenceAlt: number, terrainAlt: number): number | undefined {
  if ("altitude" in cmd.params) {
    switch (cmd.frame) {
      case 0: // MSL
        return cmd.params.altitude - terrainAlt
      case 2: // non destination
        return undefined
      case 3: // relative to reference
        return cmd.params.altitude + referenceAlt - terrainAlt
      case 10: //relative to terrain
        return cmd.params.altitude
    }
  }
  else return undefined
}

// convert the command's altitude to relative to reference
export function getAltRel(cmd: Command, referenceAlt: number, terrainAlt: number): number | undefined {
  if ("altitude" in cmd.params) {
    switch (cmd.frame) {
      case 0: // MSL
        return cmd.params.altitude - referenceAlt
      case 2: // non destination
        return undefined
      case 3: // relative to reference
        return cmd.params.altitude
      case 10: //relative to terrain
        return cmd.params.altitude + terrainAlt - referenceAlt
    }
  }
  else return undefined
}


/*
 * find the average latitude and longitude of an array of locations
 * @param locs - Array of locations as LatLng
 * returns a new LatLng
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
