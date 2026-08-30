import { describe, test, expect } from "vitest";
import { boundingBoxAround, distanceKm, formatCoords } from "@/lib/habitat/geo";

describe("boundingBoxAround", () => {
  test("equator box is roughly square in degrees", () => {
    const box = boundingBoxAround(0, 0, 50);
    const latSpan = box.latMax - box.latMin;
    const lonSpan = box.lonMax - box.lonMin;
    expect(Math.abs(latSpan - lonSpan)).toBeLessThan(0.05);
  });

  test("longitude span widens at high latitude for the same radius", () => {
    const equatorBox = boundingBoxAround(0, 0, 50);
    const highLatBox = boundingBoxAround(60, 0, 50);
    const equatorLonSpan = equatorBox.lonMax - equatorBox.lonMin;
    const highLatLonSpan = highLatBox.lonMax - highLatBox.lonMin;
    expect(highLatLonSpan).toBeGreaterThan(equatorLonSpan);
  });

  test("clamps latitude to [-90, 90]", () => {
    const box = boundingBoxAround(89, 0, 500);
    expect(box.latMax).toBeLessThanOrEqual(90);
    expect(box.latMin).toBeGreaterThanOrEqual(-90);
  });

  test("rejects non-numeric input", () => {
    expect(() => boundingBoxAround("40" as unknown as number, -74, 50)).toThrow(TypeError);
    expect(() => boundingBoxAround(40, undefined as unknown as number, 50)).toThrow(TypeError);
  });

  test("rejects out-of-range latitude", () => {
    expect(() => boundingBoxAround(95, 0, 50)).toThrow(RangeError);
  });

  test("rejects zero/negative radius", () => {
    expect(() => boundingBoxAround(0, 0, 0)).toThrow(RangeError);
    expect(() => boundingBoxAround(0, 0, -10)).toThrow(RangeError);
  });
});

describe("distanceKm", () => {
  test("same point is zero", () => {
    expect(distanceKm(40.36, -74.62, 40.36, -74.62)).toBe(0);
  });

  test("known distance NYC to Philadelphia is roughly 130km", () => {
    const d = distanceKm(40.7128, -74.006, 39.9526, -75.1652);
    expect(d).toBeGreaterThan(110);
    expect(d).toBeLessThan(150);
  });
});

describe("formatCoords", () => {
  test("formats hemispheres correctly", () => {
    expect(formatCoords(40.36, -74.62)).toBe("40.36°N, 74.62°W");
    expect(formatCoords(-33.87, 151.21)).toBe("33.87°S, 151.21°E");
  });
});
