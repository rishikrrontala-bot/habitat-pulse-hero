import { describe, test, expect } from "vitest";
import {
  parseGeocodingResults,
  classifyAqi,
  parseAirQuality,
  parseWeather,
  parseGbifSpecies,
  buildGbifSpeciesUrl,
} from "@/lib/habitat/parsers";
import { distanceKm, boundingBoxAround } from "@/lib/habitat/geo";

// ---- Geocoding -------------------------------------------------------------

describe("parseGeocodingResults", () => {
  test("handles a normal response", () => {
    const json = {
      results: [
        { id: 1, name: "Princeton", admin1: "New Jersey", country: "United States", country_code: "US", latitude: 40.35, longitude: -74.66, timezone: "America/New_York", population: 30681 },
      ],
    };
    const out = parseGeocodingResults(json);
    expect(out.length).toBe(1);
    expect(out[0].label).toBe("Princeton, New Jersey, United States");
    expect(out[0].lat).toBe(40.35);
  });

  test("no matches returns empty array, not null/throw", () => {
    expect(parseGeocodingResults({ results: [] })).toEqual([]);
  });

  test("malformed/missing payload returns empty array", () => {
    expect(parseGeocodingResults({})).toEqual([]);
    expect(parseGeocodingResults(null)).toEqual([]);
    expect(parseGeocodingResults(undefined)).toEqual([]);
  });

  test("builds a sane label when admin1 is missing (common outside the US)", () => {
    const json = { results: [{ id: 2, name: "Reykjavik", country: "Iceland", latitude: 64.15, longitude: -21.94 }] };
    const out = parseGeocodingResults(json);
    expect(out[0].label).toBe("Reykjavik, Iceland");
  });
});

// ---- AQI classification ----------------------------------------------------

describe("classifyAqi", () => {
  test("boundary values land in the correct tier", () => {
    expect(classifyAqi(0)?.level).toBe("good");
    expect(classifyAqi(50)?.level).toBe("good");
    expect(classifyAqi(51)?.level).toBe("moderate");
    expect(classifyAqi(100)?.level).toBe("moderate");
    expect(classifyAqi(101)?.level).toBe("unhealthy-sensitive");
    expect(classifyAqi(150)?.level).toBe("unhealthy-sensitive");
    expect(classifyAqi(151)?.level).toBe("unhealthy");
    expect(classifyAqi(200)?.level).toBe("unhealthy");
    expect(classifyAqi(201)?.level).toBe("very-unhealthy");
    expect(classifyAqi(300)?.level).toBe("very-unhealthy");
    expect(classifyAqi(301)?.level).toBe("hazardous");
    expect(classifyAqi(500)?.level).toBe("hazardous");
  });

  test("rejects invalid input without throwing", () => {
    expect(classifyAqi(null)).toBe(null);
    expect(classifyAqi(undefined as unknown as number)).toBe(null);
    expect(classifyAqi(-5)).toBe(null);
    expect(classifyAqi(NaN)).toBe(null);
    expect(classifyAqi("42" as unknown as number)).toBe(null);
  });
});

// ---- Air quality ------------------------------------------------------------

describe("parseAirQuality", () => {
  test("normal response with a clear dominant pollutant", () => {
    const json = { current: { us_aqi: 42, pm2_5: 12.5, pm10: 18.3, carbon_monoxide: 220.5, nitrogen_dioxide: 15.2, sulphur_dioxide: 3.8, ozone: 45.6 } };
    const out = parseAirQuality(json);
    expect(out.hasData).toBe(true);
    expect(out.aqi).toBe(42);
    expect(out.level).toBe("good");
    expect(out.dominantPollutant).toBe("PM2.5");
    expect(out.pollutants.length).toBe(6);
  });

  test('missing "current" block degrades gracefully', () => {
    const out = parseAirQuality({});
    expect(out.hasData).toBe(false);
    expect(out.level).toBe("unknown");
    expect(out.advice).toMatch(/unavailable/);
    expect(out.pollutants.length).toBe(0);
  });

  test("null pollutant fields are excluded, not shown as zero", () => {
    const json = { current: { us_aqi: 60, pm2_5: null, ozone: 80 } };
    const out = parseAirQuality(json);
    const keys = out.pollutants.map((p) => p.key);
    expect(keys).not.toContain("pm2_5");
    expect(keys).toContain("ozone");
  });
});

// ---- Weather -----------------------------------------------------------------

describe("parseWeather", () => {
  test("normal response", () => {
    const json = {
      current: { temperature_2m: 22.4, relative_humidity_2m: 55, wind_speed_10m: 12, precipitation: 0 },
      daily: { temperature_2m_max: [26.1], temperature_2m_min: [15.3] },
    };
    const out = parseWeather(json);
    expect(out.hasData).toBe(true);
    expect(out.tempC).toBe(22.4);
    expect(out.todayMaxC).toBe(26.1);
  });

  test("empty payload degrades gracefully", () => {
    const out = parseWeather({});
    expect(out.hasData).toBe(false);
    expect(out.tempC).toBe(null);
    expect(out.todayMaxC).toBe(null);
  });
});

// ---- GBIF species -------------------------------------------------------------

describe("parseGbifSpecies", () => {
  test("dedupes to one entry per species, keeping the most recent year", () => {
    const json = {
      results: [
        { speciesKey: 1, species: "Danaus plexippus", vernacularName: "Monarch butterfly", iucnRedListCategory: "EN", year: 2019, decimalLatitude: 40.3, decimalLongitude: -74.6 },
        { speciesKey: 1, species: "Danaus plexippus", vernacularName: "Monarch butterfly", iucnRedListCategory: "EN", year: 2023, decimalLatitude: 40.31, decimalLongitude: -74.61 },
        { speciesKey: 2, species: "Chelonia mydas", vernacularName: "Green sea turtle", iucnRedListCategory: "EN", year: 2020, decimalLatitude: 40.2, decimalLongitude: -74.5 },
      ],
    };
    const out = parseGbifSpecies(json, 40.3, -74.6, distanceKm);
    expect(out.length).toBe(2);
    const monarch = out.find((s) => s.taxonKey === 1);
    expect(monarch?.lastSeenYear).toBe(2023);
  });

  test("sorts most severe (CR) before less severe (VU), recency as tiebreak", () => {
    const json = {
      results: [
        { speciesKey: 1, species: "A vulnerablis", iucnRedListCategory: "VU", year: 2022 },
        { speciesKey: 2, species: "B criticalis", iucnRedListCategory: "CR", year: 2018 },
        { speciesKey: 3, species: "C endangerus", iucnRedListCategory: "EN", year: 2021 },
      ],
    };
    const out = parseGbifSpecies(json, 0, 0);
    expect(out.map((s) => s.category)).toEqual(["CR", "EN", "VU"]);
  });

  test("records without an IUCN category are excluded (not every GBIF record has one)", () => {
    const json = {
      results: [
        { speciesKey: 1, species: "No status species", year: 2021 },
        { speciesKey: 2, species: "Has status species", iucnRedListCategory: "NT", year: 2021 },
      ],
    };
    const out = parseGbifSpecies(json, 0, 0);
    expect(out.length).toBe(1);
    expect(out[0].scientificName).toBe("Has status species");
  });

  test("empty results returns empty array, never throws", () => {
    expect(parseGbifSpecies({ results: [] }, 0, 0)).toEqual([]);
    expect(parseGbifSpecies({}, 0, 0)).toEqual([]);
    expect(parseGbifSpecies(null, 0, 0)).toEqual([]);
  });

  test("falls back to scientificName when species field absent", () => {
    const json = { results: [{ speciesKey: 9, scientificName: "Ursus maritimus (Phipps, 1774)", iucnRedListCategory: "VU", year: 2020 }] };
    const out = parseGbifSpecies(json, 0, 0);
    expect(out[0].scientificName).toBe("Ursus maritimus (Phipps, 1774)");
  });
});

// ---- buildGbifSpeciesUrl --------------------------------------------------
//
// Regression coverage for a real bug caught via live API verification on the
// shipped habitat-pulse app: GBIF's `iucnRedListCategory` filter does NOT
// accept a comma-joined list the way `decimalLatitude`/`decimalLongitude`
// ranges do. `iucnRedListCategory=CR,EN,VU,NT` as one value matches 0
// records against GBIF's real API, in bounding boxes with 200k+ occurrences
// in range and known threatened species present. Passing the same four
// categories as *repeated* params returns thousands. These tests pin the
// URL shape, not just the function's return type, because a refactor that
// "simplifies" the repeated params back into one comma-joined value would
// pass a return-type-only test while quietly reintroducing the bug.

describe("buildGbifSpeciesUrl", () => {
  test("repeats iucnRedListCategory once per category, never comma-joined", () => {
    const bbox = boundingBoxAround(21.9497, 89.1833, 50);
    const url = buildGbifSpeciesUrl(bbox, 2011, 2026);
    const params = new URL(url).searchParams;
    expect(params.getAll("iucnRedListCategory")).toEqual(["CR", "EN", "VU", "NT"]);
    expect(url.includes("CR,EN,VU,NT")).toBe(false);
  });

  test("respects a custom category list instead of the default four", () => {
    const bbox = boundingBoxAround(0, 0, 50);
    const url = buildGbifSpeciesUrl(bbox, 2020, 2026, ["CR"]);
    const params = new URL(url).searchParams;
    expect(params.getAll("iucnRedListCategory")).toEqual(["CR"]);
  });

  test("encodes the lat/lon range and year range as single comma-joined values (GBIF does accept ranges in that form)", () => {
    const bbox = boundingBoxAround(10, 20, 50);
    const url = buildGbifSpeciesUrl(bbox, 2011, 2026);
    const params = new URL(url).searchParams;
    expect(params.get("decimalLatitude")).toBe(`${bbox.latMin.toFixed(4)},${bbox.latMax.toFixed(4)}`);
    expect(params.get("decimalLongitude")).toBe(`${bbox.lonMin.toFixed(4)},${bbox.lonMax.toFixed(4)}`);
    expect(params.get("year")).toBe("2011,2026");
    expect(params.get("hasCoordinate")).toBe("true");
  });

  test("defaults limit to 200, honors an explicit limit", () => {
    const bbox = boundingBoxAround(0, 0, 50);
    expect(new URL(buildGbifSpeciesUrl(bbox, 2020, 2026)).searchParams.get("limit")).toBe("200");
    expect(new URL(buildGbifSpeciesUrl(bbox, 2020, 2026, ["CR"], 50)).searchParams.get("limit")).toBe("50");
  });
});
