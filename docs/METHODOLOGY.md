# Methodology

Habitat Pulse shows three independent, live data sources for a searched
location. Nothing is blended into a single opaque "health score" — the
judgement in `docs/LIMITATIONS.md` explains why.

## Air quality now

Source: [Open-Meteo Air Quality API](https://open-meteo.com/en/docs/air-quality-api)
(CC BY 4.0), `current` block for `us_aqi, pm10, pm2_5, carbon_monoxide,
nitrogen_dioxide, sulphur_dioxide, ozone`.

- The headline number is Open-Meteo's own **US AQI**, computed server-side
  from EPA breakpoints.
- The severity tier (Good → Hazardous) uses the standard EPA AQI breakpoints
  (0–50, 51–100, 101–150, 151–200, 201–300, 301+), implemented in
  `lib/habitat/parsers.ts::classifyAqi`.
- "Likely driven by" is a heuristic, not something the API returns directly:
  each pollutant's raw concentration is divided by a rough WHO/EPA guideline
  reference value, and the pollutant with the highest ratio is shown. It's
  labeled as a heuristic on purpose — it is *not* the official per-pollutant
  AQI breakdown, which Open-Meteo's free tier doesn't expose.

## Climate snapshot

Source: [Open-Meteo Forecast API](https://open-meteo.com/en/docs/), current
temperature/humidity/wind/precipitation plus today's forecast high/low.
Shown as-is, no derived scoring.

## Threatened species recorded within 50km

Source: [GBIF Occurrence Search](https://www.gbif.org/developer/occurrence)
(`iucnRedListCategory` facet, cross-referenced from IUCN Red List data GBIF
ingests directly — see
[GBIF's IUCN integration announcement](https://www.gbif.org/news/3vu7HxLgHTqKtSF69oNqNr/new-feature-enables-search-of-occurrence-data-by-global-iucn-red-list-category)).

1. A bounding box is built around the searched point with a 50km radius
   (`lib/habitat/geo.ts::boundingBoxAround`, longitude degrees scaled by
   `cos(latitude)` so the box is genuinely ~50km on each side, not a fixed
   degree offset that would be enormous near the equator and tiny near the
   poles).
2. GBIF occurrence records inside that box are filtered to
   `iucnRedListCategory ∈ {CR, EN, VU, NT}` (Critically Endangered,
   Endangered, Vulnerable, Near Threatened) and to the last 15 years, via
   `lib/habitat/parsers.ts::buildGbifSpeciesUrl` — sent as **repeated**
   `iucnRedListCategory` query params, not one comma-joined value (GBIF
   silently matches zero records for the comma-joined form; see
   `docs/LIMITATIONS.md`).
3. Records are deduplicated to one entry per species (`speciesKey`),
   keeping the most recently observed record.
4. Sorted most-severe-first (CR → EN → VU → NT), ties broken by recency.

This is **occurrence history, not a live presence feed** — see
`docs/LIMITATIONS.md` for exactly what that does and doesn't mean.

## The pulse line

The animated line above the location header (inside `ResultsSection.tsx`)
is the one place the results page compresses to a single visual: line
**color** follows the live AQI severity tier; line **height/amplitude**
scales with the count of threatened-species records found nearby. It's
captioned in plain text under the graphic for screen readers and for
anyone who'd rather not decode a chart. It is a summary of the two data
points above it, not a new metric.

This is distinct from the decorative waveform woven into the scroll-
expansion hero's icon/branding — that one is never derived from real data
(see `docs/LIMITATIONS.md`).

## What's *not* computed

There is deliberately no single "habitat health score." Air quality this
minute and multi-year species occurrence records measure different things
on different timescales, and collapsing them into one number would imply
a precision the underlying data doesn't support. See `docs/LIMITATIONS.md`.
