import { expect, test } from "bun:test";
import { bearingBetweenPoints, gradient, haversineDistance, latLngToVector, worldBearing } from "@libs/world/distance";
import { avgLatLng } from "@libs/world/latlng";
import { openInEditor } from "bun";

test("world distance better func", () => {
  expect(haversineDistance({ lng: 0, lat: 0 }, { lng: 0, lat: 0 })).toBeCloseTo(0)
  expect(haversineDistance({ lng: 0, lat: 0 }, { lng: 20, lat: 20 })).toBeCloseTo(3112445.04)
  expect(haversineDistance({ lng: 20, lat: 20 }, { lng: 0, lat: 0 })).toBeCloseTo(3112445.04)
  expect(haversineDistance({ lng: 0, lat: 0 }, { lng: 90, lat: 0 })).toBeCloseTo(10007543.4)
  expect(haversineDistance({ lng: 0, lat: 0 }, { lng: 90, lat: 40 })).toBeCloseTo(10007543.4)
  expect(haversineDistance({ lat: 40.7128, lng: 74.006 }, { lat: 51.5072, lng: 0.1276 })).toBeCloseTo(5570242.31)
  expect(haversineDistance({ lat: -30, lng: 12 }, { lat: 30, lng: 127 })).toBeCloseTo(13848000, -3)
})

test("world Bearing", () => {
  expect(worldBearing({ lng: 0, lat: 0 }, { lng: 0, lat: 0 })).toBeUndefined()
  expect(worldBearing({ lng: 0, lat: 0 }, { lng: 0, lat: 10 })).toBe(0)
  expect(worldBearing({ lng: 0, lat: 0 }, { lng: 0, lat: -10 })).toBeCloseTo(180)
  expect(worldBearing({ lng: -10, lat: 0 }, { lng: 0, lat: 0 })).toBeCloseTo(90)
  expect(worldBearing({ lng: -10, lat: 10 }, { lng: 0, lat: 0 })).toBeCloseTo(135, 0)
})

test("Average LatLng", () => {
  expect(avgLatLng([{ lat: 0, lng: 0 }])).toEqual({ lat: 0, lng: 0 })

  expect(avgLatLng([])).toBeUndefined()

  expect(avgLatLng([{ lat: 10, lng: 10 }, { lat: -10, lng: 10 }, { lat: -10, lng: -10 }, { lat: 10, lng: -10 }])).toEqual({ lat: 0, lng: 0 })
})

test("angle between points 90º", () => {
  const p1 = { lat: 0, lng: 1 }
  const p2 = { lat: 0, lng: 0 }
  const p3 = { lat: 1, lng: 0 }
  expect(bearingBetweenPoints(p1, p2, p3)).toBeCloseTo(90)
})

test("angle between points 180º", () => {
  const p1 = { lat: 0, lng: 1 }
  const p2 = { lat: 0, lng: 0 }
  const p3 = { lat: 0, lng: 1 }
  expect(bearingBetweenPoints(p1, p2, p3)).toBeCloseTo(180)
})

test("angle between points p1=p2", () => {
  const p1 = { lat: 0, lng: 0 }
  const p2 = { lat: 0, lng: 0 }
  const p3 = { lat: 1, lng: 0 }
  expect(bearingBetweenPoints(p1, p2, p3)).toBeUndefined()
})

test("angle between points same p2=p3", () => {
  const p1 = { lat: 0, lng: 1 }
  const p2 = { lat: 0, lng: 0 }
  const p3 = { lat: 0, lng: 0 }
  expect(bearingBetweenPoints(p1, p2, p3)).toBeUndefined()
})

test("angle between points same p1=p2=p3", () => {
  const p1 = { lat: 0, lng: 0 }
  const p2 = { lat: 0, lng: 0 }
  const p3 = { lat: 0, lng: 0 }
  expect(bearingBetweenPoints(p1, p2, p3)).toBeUndefined()
})

test("angle between points left 90", () => {
  const p1 = { lat: 0, lng: 1 }
  const p2 = { lat: 0, lng: 0 }
  const p3 = { lat: -1, lng: 0 }
  expect(bearingBetweenPoints(p1, p2, p3)).toBeCloseTo(270)
})

test("angle between points 180", () => {
  const p1 = { lat: 0, lng: 0 }
  const p2 = { lat: 0, lng: 1 }
  const p3 = { lat: 0, lng: 0 }
  expect(bearingBetweenPoints(p1, p2, p3)).toBeCloseTo(180)
})

test("angle between points 270", () => {
  const p1 = { lat: -1, lng: 0 }
  const p2 = { lat: 0, lng: 0 }
  const p3 = { lat: 0, lng: -1 }
  expect(bearingBetweenPoints(p1, p2, p3)).toBeCloseTo(270)
})

test("angle between points left 90", () => {
  const p1 = { lat: 0, lng: 90 }
  const p2 = { lat: 0, lng: 0 }
  const p3 = { lat: 90, lng: 0 }
  expect(bearingBetweenPoints(p1, p2, p3)).toBeCloseTo(90)
})

test("gradient level", () => {
  expect(gradient(10, 10, 10)).toBe(0)
  expect(gradient(10, 10, 0)).toBe(-45)
  expect(gradient(10, 10, 20)).toBe(45)
  expect(gradient(0, 10, 20)).toBe(90)
  expect(gradient(0, 10, 0)).toBe(-90)
})

// TODO fix to proper units
test.skip("latLng to vector", () => {
  expect(latLngToVector({ lat: 0, lng: 0 })).toEqual([0, 1, 0])
})
















