import { describe, test, expect } from "vitest";
import { buildActionItems } from "@/lib/habitat/actions";
import { parseAirQuality, parseGbifSpecies } from "@/lib/habitat/parsers";

describe("buildActionItems", () => {
  test("good air + no species still returns non-empty, honest guidance", () => {
    const airQuality = parseAirQuality({ current: { us_aqi: 20, pm2_5: 5 } });
    const species = parseGbifSpecies({ results: [] }, 0, 0);
    const actions = buildActionItems({ airQuality, species, locationLabel: "Test City" });
    expect(actions.length).toBeGreaterThanOrEqual(2);
    expect(actions.some((a) => a.id === "aqi-good")).toBe(true);
    expect(actions.some((a) => a.id === "species-none-found")).toBe(true);
  });

  test("unhealthy-for-sensitive-groups air produces a limit-exertion action", () => {
    const airQuality = parseAirQuality({ current: { us_aqi: 120, pm2_5: 55 } });
    const actions = buildActionItems({ airQuality, species: [], locationLabel: "Riverside" });
    const aqiAction = actions.find((a) => a.id === "aqi-limit-exertion");
    expect(aqiAction).toBeTruthy();
    expect(aqiAction?.text).toMatch(/PM2\.5/);
  });

  test("very-unhealthy air produces an avoid-exertion action referencing the location", () => {
    const airQuality = parseAirQuality({ current: { us_aqi: 250, pm2_5: 200 } });
    const actions = buildActionItems({ airQuality, species: [], locationLabel: "Riverside" });
    const aqiAction = actions.find((a) => a.id === "aqi-avoid-exertion");
    expect(aqiAction).toBeTruthy();
    expect(aqiAction?.text).toMatch(/Riverside/);
  });

  test("threatened species present produces a species-report action citing count and top species", () => {
    const json = {
      results: [
        { speciesKey: 1, species: "Danaus plexippus", vernacularName: "Monarch butterfly", iucnRedListCategory: "EN", year: 2023, decimalLatitude: 40.3, decimalLongitude: -74.6 },
      ],
    };
    const species = parseGbifSpecies(json, 40.3, -74.6);
    const airQuality = parseAirQuality({});
    const actions = buildActionItems({ airQuality, species, locationLabel: "Test" });
    const reportAction = actions.find((a) => a.id === "species-report");
    expect(reportAction).toBeTruthy();
    expect(reportAction?.text).toMatch(/Monarch butterfly/);
    expect(reportAction?.text).toMatch(/Endangered/);
    expect(reportAction?.href).toContain("gbif.org/species/1");
  });

  test("never throws when both inputs are empty/missing", () => {
    expect(() => buildActionItems({ airQuality: parseAirQuality({}), species: [], locationLabel: "" })).not.toThrow();
    expect(() => buildActionItems({ airQuality: undefined, species: null })).not.toThrow();
  });

  test('does not claim "no species found" when the species source failed (null) vs. genuinely found none ([])', () => {
    const airQuality = parseAirQuality({});
    const failedSource = buildActionItems({ airQuality, species: null, locationLabel: "X" });
    const genuinelyEmpty = buildActionItems({ airQuality, species: [], locationLabel: "X" });
    expect(failedSource.some((a) => a.id.startsWith("species-"))).toBe(false);
    expect(genuinelyEmpty.some((a) => a.id === "species-none-found")).toBe(true);
  });

  test("does not fabricate an AQI action when air quality data is unavailable", () => {
    const airQuality = parseAirQuality({});
    const actions = buildActionItems({ airQuality, species: [], locationLabel: "X" });
    expect(actions.some((a) => a.id.startsWith("aqi-"))).toBe(false);
  });
});
