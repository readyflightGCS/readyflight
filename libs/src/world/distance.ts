import { deg2rad, mod2pi, modf, rad2deg } from "@libs/math/geometry";
import { LatLng, latLngEqual } from "./latlng";

/*
 * Calculate the distance between two points on a globe
 * @param {LatLng} pos1 the first position
 * @param {LatLng} pos2 the second position
 * @returns {number} distance in meters
 */
export function haversineDistance(pos1: LatLng, pos2: LatLng): number {
  const R = 6371000; // Earth's radius in meters

  const deltaLat = deg2rad(pos2.lat - pos1.lat);
  const deltaLng = deg2rad(pos2.lng - pos1.lng);

  const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(deg2rad(pos1.lat)) * Math.cos(deg2rad(pos2.lat)) *
    Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance;
}

/**
 * Calculate the angle between three global coordinates
 * @param {LatLng} pos1 - The first point
 * @param {LatLng} pos2 - The second point
 * @param {LatLng} pos3 - The third point
 * @returns {number} The angle between the three points in degrees
 */
export function bearingBetweenPoints(pos1: LatLng, pos2: LatLng, pos3: LatLng): number | undefined {
  if (latLngEqual(pos1, pos2) || latLngEqual(pos2, pos3)) {
    return undefined
  }
  const a2b = worldBearing(pos1, pos2) as number
  const b2c = worldBearing(pos2, pos3) as number

  return modf(b2c - a2b, 360)
}

/**
 * Convert a latitude/longitude coordinate to a 3D Cartesian vector 
 * TODO: rename/fix for proper spheroid units/calculations
 * @param {LatLng} pos - The latitude/longitude coordinate to convert
 * @returns {[number, number, number]} A tuple containing the x, y, z coordinates of the vector normalised to 1
 */
export function latLngToVector(pos: LatLng): [number, number, number] {
  const latRad = deg2rad(pos.lat);
  const lngRad = deg2rad(pos.lng);

  const x = Math.cos(latRad) * Math.cos(lngRad);
  const y = Math.cos(latRad) * Math.sin(lngRad);
  const z = Math.sin(latRad);

  return [x, y, z];
}

/**
 * Calculate the gradient between two altitudes
 * @param {number} distance - The distance between the two points
 * @param {number} alt1 - The first altitude
 * @param {number} alt2 - The second altitude
 * @returns {number} The gradient in degrees
 */
export function gradient(distance: number, alt1: number, alt2: number): number {
  const altitudeChange = alt2 - alt1;
  const gradientRadians = Math.atan(altitudeChange / distance);
  const gradientDegrees = gradientRadians * (180 / Math.PI);
  return Number(gradientDegrees.toPrecision(3));
}

/**
 * Format a distance in meters to a human-readable string
 * @param {number} distanceInMeters - The distance in meters
 * @returns {string} The formatted distance
 */
export function formatDistance(distanceInMeters: number): string {
  // If the distance is less than 1 kilometer, return in meters rounded to three significant figures
  if (distanceInMeters < 1000) {
    const roundedMeters = Number(distanceInMeters.toPrecision(3));
    return `${roundedMeters} meters`;
  } else {
    // Otherwise, convert to kilometers and round to three significant figures
    let distanceInKilometers = distanceInMeters / 1000;
    const roundedKilometers = Number(distanceInKilometers.toPrecision(3));
    return `${roundedKilometers} kilometers`;
  }
}

/*
 * The Bearing between two points in degrees
 */
export function worldBearing(a: LatLng, b: LatLng): number | undefined {
  if (latLngEqual(a, b)) {
    return undefined
  }

  const lat1 = deg2rad(a.lat)
  const lat2 = deg2rad(b.lat)
  const lon1 = deg2rad(a.lng)
  const lon2 = deg2rad(b.lng)

  const deltaLon = lon2 - lon1

  const y = Math.sin(deltaLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLon);

  const initialBearing = Math.atan2(y, x); // Bearing in radians

  return rad2deg(mod2pi(initialBearing))
}

/*
 * Offset get a point offset from start by a distance and bearing in degrees
 * @param {LatLng} start - the starting location
 * @param {number} distance - the distance to offset
 * @param {number} bearing - the bearing to offset in degrees from north, clockwise
 */
export function worldOffset(start: LatLng, distance: number, bearing: number): LatLng {
  if (distance === 0) return start;

  const R = 6371000; // Earth's radius in meters
  const lat1 = deg2rad(start.lat);
  const lon1 = deg2rad(start.lng);

  // Convert distance to angular distance
  const angularDistance = distance / R;

  // Calculate new latitude
  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(angularDistance) +
    Math.cos(lat1) * Math.sin(angularDistance) * Math.cos(deg2rad(bearing))
  );

  // Calculate new longitude
  const lon2 = lon1 + Math.atan2(
    Math.sin(deg2rad(bearing)) * Math.sin(angularDistance) * Math.cos(lat1),
    Math.cos(angularDistance) - Math.sin(lat1) * Math.sin(lat2)
  );

  // Handle pole crossing
  let finalLat = lat2;
  let finalLon = lon2;

  // If we've crossed a pole, adjust longitude
  if (Math.abs(lat2) > Math.PI / 2) {
    // Flip latitude to the other side of the pole
    finalLat = Math.sign(lat2) * Math.PI - lat2;
    // Add 180 degrees to longitude
    finalLon = lon2 + Math.PI;
  }

  let lng = rad2deg(mod2pi(finalLon + Math.PI) - Math.PI)
  if (lng == -180) { lng = 180 }

  return {
    lat: rad2deg(mod2pi(finalLat + Math.PI) - Math.PI),
    lng
  };
}
