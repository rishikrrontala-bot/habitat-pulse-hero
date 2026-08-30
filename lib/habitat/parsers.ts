/**
 * parsers.ts — turns raw API JSON into clean, UI-ready domain objects.
 * Pure functions only: given the same JSON, always the same output. No
 * fetch, no Date.now(). Ported 1:1 from the shipped habitat-pulse app's
 * src/parsers.js, with types added.
 */
import type { BoundingBox } from "./geo";

// ---- Geocoding (Open-Meteo /v1/search) ------------------------------------

export interface GeocodingResult {
  id: number | undefined;
  name: string;
  admin1: string;
  country: string;
  countryCode: string;
  lat: number;
  lon: number;
  timezone: string;
  population: number | null;
  label: string;
}

export function parseGeocodingResults(json: unknown): GeocodingResult[] {
  const j = json as { results?: unknown[] } | null | undefined;
  if (!j || !Array.isArray(j.results)) return [];
  return j.results.map((raw) => {
    const r = raw as Record<string, unknown>;
    return {
      id: r.id as number | undefined,
      name: r.name as string,
      admin1: (r.admin1 as string) || "",
      country: (r.country as string) || "",
      countryCode: (r.country_code as string) || "",
      lat: r.latitude as number,
      lon: r.longitude as number,
      timezone: (r.timezone as string) || "UTC",
      population: typeof r.population === "number" ? r.population : null,
      label: [r.name, r.admin1, r.country].filter(Boolean).join(", "),
    };
  });
}

// ---- Air quality (Open-Meteo air-quality /v1/air-quality) ----------------

export type AqiLevel = "good" | "moderate" | "unhealthy-sensitive" | "unhealthy" | "very-unhealthy" | "hazardous";

interface AqiTier {
  max: number;
  level: AqiLevel;
  label: string;
  advice: string;
}

// US EPA breakpoints. https://www.airnow.gov/aqi/aqi-basics/
export const AQI_LEVELS: AqiTier[] = [
  { max: 50, level: "good", label: "Good", advice: "Air quality is satisfactory for everyone." },
  { max: 100, level: "moderate", label: "Moderate", advice: "Acceptable, but unusually sensitive people should consider reducing prolonged outdoor exertion." },
  { max: 150, level: "unhealthy-sensitive", label: "Unhealthy for Sensitive Groups", advice: "People with respiratory or heart conditions, children, and older adults should limit prolonged outdoor exertion." },
  { max: 200, level: "unhealthy", label: "Unhealthy", advice: "Everyone may begin to experience health effects; sensitive groups should avoid prolonged outdoor exertion." },
  { max: 300, level: "very-unhealthy", label: "Very Unhealthy", advice: "Health alert: everyone may experience more serious health effects. Avoid outdoor exertion." },
  { max: Infinity, level: "hazardous", label: "Hazardous", advice: "Health warning of emergency conditions. Everyone should avoid all outdoor exertion." },
];

export function classifyAqi(aqi: number | null): AqiTier | null {
  if (typeof aqi !== "number" || Number.isNaN(aqi) || aqi < 0) return null;
  return AQI_LEVELS.find((tier) => aqi <= tier.max) || AQI_LEVELS[AQI_LEVELS.length - 1];
}

const POLLUTANT_LABELS: Record<string, string> = {
  pm2_5: "PM2.5",
  pm10: "PM10",
  ozone: "Ozone",
  nitrogen_dioxide: "NO₂",
  sulphur_dioxide: "SO₂",
  carbon_monoxide: "CO",
};

export interface Pollutant {
  key: string;
  label: string;
  value: number;
}

export interface AirQuality {
  hasData: boolean;
  aqi: number | null;
  level: AqiLevel | "unknown";
  levelLabel: string;
  advice: string;
  dominantPollutant: string | null;
  pollutants: Pollutant[];
}

export function parseAirQuality(json: unknown): AirQuality {
  const j = json as { current?: Record<string, unknown> } | null | undefined;
  const c = (j && j.current) || {};
  const aqi = typeof c.us_aqi === "number" ? (c.us_aqi as number) : null;
  const tier = classifyAqi(aqi);

  const pollutants: Pollutant[] = Object.keys(POLLUTANT_LABELS)
    .filter((key) => typeof c[key] === "number")
    .map((key) => ({ key, label: POLLUTANT_LABELS[key], value: c[key] as number }));

  // The dominant pollutant is the one Open-Meteo's own us_aqi is most likely
  // driven by; we don't get that breakdown for free, so we surface the
  // pollutant with the highest raw concentration relative to typical WHO
  // guideline values as a rough, clearly-labeled heuristic — not a claim.
  const REFERENCE: Record<string, number> = { pm2_5: 15, pm10: 45, ozone: 100, nitrogen_dioxide: 25, sulphur_dioxide: 40, carbon_monoxide: 4000 };
  let dominant: string | null = null;
  let dominantRatio = 0;
  for (const p of pollutants) {
    const ref = REFERENCE[p.key];
    const ratio = ref ? p.value / ref : 0;
    if (ratio > dominantRatio) {
      dominantRatio = ratio;
      dominant = p.label;
    }
  }

  return {
    hasData: aqi !== null,
    aqi,
    level: tier ? tier.level : "unknown",
    levelLabel: tier ? tier.label : "No data",
    advice: tier ? tier.advice : "Live air quality data is unavailable for this location right now.",
    dominantPollutant: dominant,
    pollutants,
  };
}

// ---- Weather (Open-Meteo /v1/forecast) ------------------------------------

export interface Weather {
  hasData: boolean;
  tempC: number | null;
  humidityPct: number | null;
  windKmh: number | null;
  precipMm: number | null;
  todayMaxC: number | null;
  todayMinC: number | null;
}

export function parseWeather(json: unknown): Weather {
  const j = json as { current?: Record<string, unknown>; daily?: Record<string, unknown> } | null | undefined;
  const c = (j && j.current) || {};
  const d = (j && j.daily) || {};
  return {
    hasData: typeof c.temperature_2m === "number",
    tempC: typeof c.temperature_2m === "number" ? (c.temperature_2m as number) : null,
    humidityPct: typeof c.relative_humidity_2m === "number" ? (c.relative_humidity_2m as number) : null,
    windKmh: typeof c.wind_speed_10m === "number" ? (c.wind_speed_10m as number) : null,
    precipMm: typeof c.precipitation === "number" ? (c.precipitation as number) : null,
    todayMaxC: Array.isArray(d.temperature_2m_max) ? (d.temperature_2m_max[0] as number) : null,
    todayMinC: Array.isArray(d.temperature_2m_min) ? (d.temperature_2m_min[0] as number) : null,
  };
}

// ---- Species (GBIF /v1/occurrence/search, filtered to IUCN categories) ----

const IUCN_ORDER: Record<string, number> = { CR: 0, EN: 1, VU: 2, NT: 3, LC: 4, DD: 5, EX: 6, EW: 7, NE: 8 };
export const IUCN_LABELS: Record<string, string> = {
  CR: "Critically Endangered",
  EN: "Endangered",
  VU: "Vulnerable",
  NT: "Near Threatened",
  EX: "Extinct",
  EW: "Extinct in the Wild",
};

export const DEFAULT_IUCN_CATEGORIES = ["CR", "EN", "VU", "NT"];

export interface Species {
  taxonKey: string | number;
  scientificName: string;
  vernacularName: string | null;
  category: string;
  categoryLabel: string;
  lastSeenYear: number | null;
  distanceKm: number | null;
  gbifUrl: string;
}

/**
 * Build the GBIF occurrence-search URL for threatened species near a bbox.
 *
 * GBIF's `decimalLatitude`/`decimalLongitude` params accept a comma-joined
 * "min,max" range in a single value — but `iucnRedListCategory` does NOT:
 * passing `CR,EN,VU,NT` as one comma-joined value silently matches zero
 * records (confirmed live against the real API, not a guess). GBIF wants
 * that filter as a *repeated* query param, one value each. Get this wrong
 * and the app's core feature — nearby threatened species — silently
 * reports "none found" everywhere, always. `URLSearchParams.append()` is
 * what produces the repeated form; don't collapse `categories` back into a
 * single joined string.
 */
export function buildGbifSpeciesUrl(
  bbox: BoundingBox,
  yearFrom: number,
  yearTo: number,
  categories?: string[],
  limit?: number
): string {
  const cats = categories && categories.length ? categories : DEFAULT_IUCN_CATEGORIES;
  const params = new URLSearchParams();
  params.set("decimalLatitude", `${bbox.latMin.toFixed(4)},${bbox.latMax.toFixed(4)}`);
  params.set("decimalLongitude", `${bbox.lonMin.toFixed(4)},${bbox.lonMax.toFixed(4)}`);
  cats.forEach((cat) => params.append("iucnRedListCategory", cat));
  params.set("hasCoordinate", "true");
  params.set("year", `${yearFrom},${yearTo}`);
  params.set("limit", String(limit || 200));
  return `https://api.gbif.org/v1/occurrence/search?${params.toString()}`;
}

type DistanceFn = (lat1: number, lon1: number, lat2: number, lon2: number) => number;

/**
 * Collapse raw GBIF occurrence *records* (which can include many sightings
 * of the same species) into one entry per species, keeping the most recent
 * record and computing a per-species distance from the query point.
 */
export function parseGbifSpecies(
  json: unknown,
  originLat: number,
  originLon: number,
  distanceFn?: DistanceFn
): Species[] {
  const j = json as { results?: unknown[] } | null | undefined;
  const results = j && Array.isArray(j.results) ? j.results : [];
  const bySpecies = new Map<string | number, Species>();

  for (const raw of results) {
    const rec = raw as Record<string, unknown>;
    const key = (rec.speciesKey as string | number) || (rec.taxonKey as string | number) || (rec.scientificName as string);
    if (!key || !rec.iucnRedListCategory) continue;
    const year = typeof rec.year === "number" ? (rec.year as number) : null;
    const lat = typeof rec.decimalLatitude === "number" ? (rec.decimalLatitude as number) : null;
    const lon = typeof rec.decimalLongitude === "number" ? (rec.decimalLongitude as number) : null;
    const category = rec.iucnRedListCategory as string;

    const entry: Species = {
      taxonKey: key,
      scientificName: (rec.species as string) || (rec.scientificName as string) || "Unknown species",
      vernacularName: (rec.vernacularName as string) || null,
      category,
      categoryLabel: IUCN_LABELS[category] || category,
      lastSeenYear: year,
      distanceKm: lat !== null && lon !== null && typeof distanceFn === "function"
        ? distanceFn(originLat, originLon, lat, lon)
        : null,
      gbifUrl: `https://www.gbif.org/species/${key}`,
    };

    const existing = bySpecies.get(key);
    if (!existing || (year || 0) > (existing.lastSeenYear || 0)) {
      bySpecies.set(key, entry);
    }
  }

  return Array.from(bySpecies.values()).sort((a, b) => {
    const rank = (IUCN_ORDER[a.category] ?? 9) - (IUCN_ORDER[b.category] ?? 9);
    if (rank !== 0) return rank;
    return (b.lastSeenYear || 0) - (a.lastSeenYear || 0);
  });
}
