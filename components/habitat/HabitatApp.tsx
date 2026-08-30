"use client";

/**
 * HabitatApp.tsx — the real habitat-pulse app (search, live air quality,
 * weather, threatened species, actions), ported from the shipped vanilla-JS
 * app (src/app.js) into React. All the actual domain logic still lives in
 * the pure, unit-tested modules under lib/habitat/*; this component is the
 * thin state/fetch/DOM-glue layer, same split as the original.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { boundingBoxAround, distanceKm, formatCoords } from "@/lib/habitat/geo";
import {
  parseGeocodingResults,
  parseAirQuality,
  parseWeather,
  parseGbifSpecies,
  buildGbifSpeciesUrl,
  type GeocodingResult,
  type AirQuality,
  type Weather,
  type Species,
} from "@/lib/habitat/parsers";
import { buildActionItems } from "@/lib/habitat/actions";
import ResultsSection from "./ResultsSection";

const SPECIES_RADIUS_KM = 50;
const SPECIES_YEARS_BACK = 15; // occurrence records older than this are noted but deprioritized in copy

interface ExampleLocation {
  name: string;
  lat: number;
  lon: number;
  admin1: string;
  country: string;
}

const EXAMPLES: ExampleLocation[] = [
  { name: "Yellowstone, WY", lat: 44.428, lon: -110.5885, admin1: "Wyoming", country: "United States" },
  { name: "Sundarbans, Bangladesh", lat: 21.9497, lon: 89.1833, admin1: "", country: "Bangladesh" },
  { name: "Manaus, Amazonas", lat: -3.119, lon: -60.0217, admin1: "Amazonas", country: "Brazil" },
  { name: "Cairns, Queensland", lat: -16.9186, lon: 145.7781, admin1: "Queensland", country: "Australia" },
  { name: "Delhi, India", lat: 28.6139, lon: 77.209, admin1: "", country: "India" },
];

interface SelectedLocation {
  name: string;
  label?: string;
  admin1: string;
  country: string;
  lat: number;
  lon: number;
}

async function fetchJson(url: string): Promise<unknown> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request failed: ${res.status} ${res.statusText} for ${url}`);
  return res.json();
}

export default function HabitatApp() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<GeocodingResult[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [status, setStatus] = useState<{ message: string; tone?: "error" } | null>(null);
  const [location, setLocation] = useState<SelectedLocation | null>(null);
  const [weather, setWeather] = useState<Weather | null>(null);
  const [air, setAir] = useState<AirQuality | null>(null);
  const [species, setSpecies] = useState<Species[] | null>(null);
  const [resultsVisible, setResultsVisible] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resultsRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const loadLocation = useCallback(async (loc: SelectedLocation) => {
    setStatus({ message: `Loading live data for ${loc.label || loc.name}…` });
    setResultsVisible(false);

    const params = new URLSearchParams();
    params.set("lat", loc.lat.toFixed(4));
    params.set("lon", loc.lon.toFixed(4));
    params.set("name", loc.name);
    window.history.replaceState(null, "", `?${params.toString()}`);
    document.title = `Habitat Pulse — ${loc.name}`;

    const bbox = boundingBoxAround(loc.lat, loc.lon, SPECIES_RADIUS_KM);
    const yearFrom = new Date().getFullYear() - SPECIES_YEARS_BACK;

    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lon}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min&timezone=auto`;
    const airUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${loc.lat}&longitude=${loc.lon}&current=us_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone&timezone=auto`;
    const speciesUrl = buildGbifSpeciesUrl(bbox, yearFrom, new Date().getFullYear());

    const [weatherResult, airResult, speciesResult] = await Promise.allSettled([
      fetchJson(weatherUrl),
      fetchJson(airUrl),
      fetchJson(speciesUrl),
    ]);

    const nextWeather = weatherResult.status === "fulfilled" ? parseWeather(weatherResult.value) : parseWeather({});
    const nextAir = airResult.status === "fulfilled" ? parseAirQuality(airResult.value) : parseAirQuality({});
    const nextSpecies = speciesResult.status === "fulfilled"
      ? parseGbifSpecies(speciesResult.value, loc.lat, loc.lon, distanceKm)
      : null; // null = the source itself failed, distinct from "queried and found zero"

    const anyFailed = [weatherResult, airResult, speciesResult].some((r) => r.status === "rejected");
    setStatus({
      message: anyFailed
        ? "Loaded — one or more live data sources didn't respond, marked below."
        : `Showing live conditions for ${loc.label || loc.name}.`,
      tone: anyFailed ? "error" : undefined,
    });

    setLocation(loc);
    setWeather(nextWeather);
    setAir(nextAir);
    setSpecies(nextSpecies);
    setResultsVisible(true);
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect --
   * Reading a deep link (?lat=&lon=&name=) genuinely requires an effect:
   * window.location isn't available during server rendering and this must
   * run once, client-side, on mount — it's syncing from an external source
   * (the URL), not deriving state that could be computed from props, which
   * is what this rule is meant to catch. Mirrors the shipped app's init(). */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has("lat") && params.has("lon")) {
      const loc: SelectedLocation = {
        name: params.get("name") || "Selected location",
        label: params.get("name") || "Selected location",
        admin1: "",
        country: "",
        lat: parseFloat(params.get("lat")!),
        lon: parseFloat(params.get("lon")!),
      };
      setQuery(loc.name);
      loadLocation(loc);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (resultsVisible && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [resultsVisible, location]);

  const closeSuggestions = useCallback(() => {
    setSuggestions([]);
    setActiveIndex(-1);
  }, []);

  const selectLocation = useCallback(
    (loc: GeocodingResult | ExampleLocation) => {
      const label = "label" in loc ? loc.label : loc.name;
      setQuery(label || loc.name);
      closeSuggestions();
      void loadLocation({ ...loc, label: label || loc.name });
    },
    [closeSuggestions, loadLocation]
  );

  const runGeocode = useCallback(async (q: string) => {
    try {
      const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=6&language=en&format=json`;
      const json = await fetchJson(url);
      setSuggestions(parseGeocodingResults(json));
    } catch {
      // Silent fail on autocomplete — the person can still press Enter /
      // Search and get a clear error there instead of a noisy dropdown.
      closeSuggestions();
    }
  }, [closeSuggestions]);

  const onInputChange = useCallback(
    (value: string) => {
      setQuery(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      const trimmed = value.trim();
      if (trimmed.length < 2) {
        closeSuggestions();
        return;
      }
      debounceRef.current = setTimeout(() => void runGeocode(trimmed), 300);
    },
    [closeSuggestions, runGeocode]
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (suggestions.length === 0) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        if (activeIndex >= 0) {
          e.preventDefault();
          selectLocation(suggestions[activeIndex]);
        }
      } else if (e.key === "Escape") {
        closeSuggestions();
      }
    },
    [suggestions, activeIndex, selectLocation, closeSuggestions]
  );

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = query.trim();
      if (!trimmed) return;
      if (activeIndex >= 0 && suggestions[activeIndex]) {
        selectLocation(suggestions[activeIndex]);
        return;
      }
      setStatus({ message: "Searching…" });
      try {
        const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(trimmed)}&count=1&language=en&format=json`;
        const json = await fetchJson(url);
        const results = parseGeocodingResults(json);
        if (results.length === 0) {
          setStatus({ message: `No location found for "${trimmed}". Try a nearby city or a different spelling.`, tone: "error" });
          return;
        }
        selectLocation(results[0]);
      } catch {
        setStatus({ message: "Location search is unreachable right now. Check your connection and try again.", tone: "error" });
      }
    },
    [query, activeIndex, suggestions, selectLocation]
  );

  const actions = useMemo(() => {
    if (!location) return [];
    return buildActionItems({ airQuality: air, species, locationLabel: location.name });
  }, [air, species, location]);

  const locationMeta = location
    ? `${formatCoords(location.lat, location.lon)}${location.admin1 || location.country ? " · " + [location.admin1, location.country].filter(Boolean).join(", ") : ""}`
    : "";

  return (
    <div className="w-full">
      <section className="mb-12">
        <h1 className="font-[family-name:var(--font-display)] font-medium text-[clamp(32px,5.2vw,52px)] leading-[1.08] tracking-[-0.01em] mb-3.5 max-w-[15ch] text-habitat-ink">
          What&rsquo;s happening, right now, where you stand.
        </h1>
        <p className="text-habitat-ink-muted text-[17px] max-w-[54ch] mb-7">
          Search any place on Earth for its live air quality, current weather, and threatened species recorded nearby — pulled straight from Open-Meteo and GBIF, no accounts, no keys, nothing invented.
        </p>

        <form onSubmit={onSubmit} role="search" className="relative max-w-[480px]">
          <label htmlFor="search-input" className="block text-[13px] uppercase tracking-[0.08em] text-habitat-ink-faint mb-2">
            Search a place
          </label>
          <div className="flex gap-2.5">
            <input
              ref={inputRef}
              id="search-input"
              type="text"
              autoComplete="off"
              role="combobox"
              aria-expanded={suggestions.length > 0}
              aria-controls="suggestions"
              aria-autocomplete="list"
              aria-activedescendant={activeIndex >= 0 ? `suggestion-${activeIndex}` : undefined}
              placeholder="City, park, coordinates-adjacent place name…"
              value={query}
              onChange={(e) => onInputChange(e.target.value)}
              onKeyDown={onKeyDown}
              onBlur={() => setTimeout(closeSuggestions, 150)}
              className="flex-1 bg-habitat-surface border border-habitat-hairline text-habitat-ink font-[family-name:var(--font-habitat-body)] text-base px-4 py-3.5 rounded-[10px] placeholder:text-habitat-ink-faint focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-habitat-focus focus-visible:outline-offset-2"
            />
            <button
              type="submit"
              className="bg-habitat-mint text-[#0e1b17] border-none font-semibold text-[15px] px-[22px] rounded-[10px] cursor-pointer hover:bg-[#9df5cf]"
            >
              Check habitat
            </button>
          </div>

          {suggestions.length > 0 && (
            <ul id="suggestions" role="listbox" aria-label="Location suggestions" className="list-none mt-2 p-1.5 absolute z-10 left-0 right-0 bg-habitat-surface-raised border border-habitat-hairline rounded-[10px] max-h-[280px] overflow-y-auto">
              {suggestions.map((r, i) => (
                <li key={`${r.lat}-${r.lon}-${i}`} role="option" id={`suggestion-${i}`} aria-selected={i === activeIndex}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => selectLocation(r)}
                    className="block w-full text-left bg-transparent border-none text-habitat-ink font-[family-name:var(--font-habitat-body)] text-[15px] px-3 py-2.5 rounded-lg cursor-pointer"
                    style={{ background: i === activeIndex ? "rgba(110, 231, 183, 0.18)" : undefined }}
                  >
                    {r.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </form>

        <div className="mt-3.5 flex gap-2 flex-wrap items-center">
          <span className="text-habitat-ink-faint text-[13px]">Try:</span>
          {EXAMPLES.map((ex) => (
            <button
              key={ex.name}
              type="button"
              onClick={() => selectLocation(ex)}
              className="bg-transparent border border-habitat-hairline text-habitat-ink-muted text-[13px] px-3 py-1.5 rounded-full cursor-pointer hover:border-habitat-mint hover:text-habitat-mint"
            >
              {ex.name}
            </button>
          ))}
        </div>

        <p role="status" aria-live="polite" className={`mt-4 text-sm min-h-5 ${status?.tone === "error" ? "text-habitat-coral" : "text-habitat-ink-muted"}`}>
          {status?.message ?? ""}
        </p>
      </section>

      {resultsVisible && location && (
        <div ref={resultsRef}>
          <ResultsSection
            location={location}
            locationMeta={locationMeta}
            weather={weather}
            air={air}
            species={species}
            actions={actions}
          />
        </div>
      )}
    </div>
  );
}
