/**
 * geo.ts — pure geographic math. No fetch, no DOM. Ported 1:1 from the
 * shipped habitat-pulse app's src/geo.js, with types added.
 */

export interface BoundingBox {
  latMin: number;
  latMax: number;
  lonMin: number;
  lonMax: number;
}

const KM_PER_DEGREE_LAT = 111.32; // ~constant everywhere on the WGS84 ellipsoid

/**
 * Build a lat/lon bounding box around a point, sized in kilometers.
 * Longitude degrees shrink toward the poles, so we scale by cos(latitude).
 *
 * Known limitation: does not unwrap the antimeridian (±180°) or the poles.
 * For a habitat-scale radius (≤100km) everywhere but the Bering Strait /
 * high Arctic this is a non-issue.
 */
export function boundingBoxAround(lat: number, lon: number, radiusKm: number): BoundingBox {
  if (typeof lat !== "number" || typeof lon !== "number" || Number.isNaN(lat) || Number.isNaN(lon)) {
    throw new TypeError(`boundingBoxAround: lat/lon must be numbers, got ${lat}, ${lon}`);
  }
  if (lat < -90 || lat > 90) throw new RangeError(`boundingBoxAround: lat out of range: ${lat}`);
  if (!(radiusKm > 0)) throw new RangeError(`boundingBoxAround: radiusKm must be positive, got ${radiusKm}`);

  const latDelta = radiusKm / KM_PER_DEGREE_LAT;
  const latClamped = Math.max(-89.9, Math.min(89.9, lat)); // guard divide-by-~0 near poles
  const lonKmPerDegree = KM_PER_DEGREE_LAT * Math.cos((latClamped * Math.PI) / 180);
  const lonDelta = radiusKm / Math.max(lonKmPerDegree, 0.001);

  return {
    latMin: clampLat(lat - latDelta),
    latMax: clampLat(lat + latDelta),
    lonMin: lon - lonDelta,
    lonMax: lon + lonDelta,
  };
}

function clampLat(lat: number): number {
  return Math.max(-90, Math.min(90, lat));
}

/** Haversine great-circle distance in km. Used to sort/label results by proximity. */
export function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Format coordinates the way a field notebook would: 40.36°N, 74.62°W */
export function formatCoords(lat: number, lon: number): string {
  const latDir = lat >= 0 ? "N" : "S";
  const lonDir = lon >= 0 ? "E" : "W";
  return `${Math.abs(lat).toFixed(2)}°${latDir}, ${Math.abs(lon).toFixed(2)}°${lonDir}`;
}
