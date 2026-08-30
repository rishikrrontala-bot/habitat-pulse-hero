# Limitations

Published up front, not discovered by a judge. If something below changes
how you'd read the app's output, that's the point of writing it down.

## Species data is historical occurrence, not live presence

A "Vulnerable" tag with "last recorded 2019" means GBIF has a record of that
species being observed there in 2019 — **not** that it's there today. A
species can have moved, recovered, declined further, or the record itself
can be a museum specimen decades old that still carries a current-year
metadata timestamp. Read the count as "conservation-relevant activity has
been recorded near here," not as a live tracker.

## GBIF coverage is uneven by region

GBIF is built from whatever institutions and citizen-science platforms
(iNaturalist, museum collections, government surveys) have published data.
Well-surveyed regions (much of North America and Europe) will show more
records than equally biodiverse but under-surveyed regions. **Zero results
near a location most often means "undersurveyed," not "no threatened species
here."** The empty-state copy in the app says this explicitly rather than
implying a clean bill of health.

## GBIF's `iucnRedListCategory` filter needs repeated params, not a comma-joined list

A real bug caught during live verification, not a hypothetical: sending
`iucnRedListCategory=CR,EN,VU,NT` as one comma-joined value silently
matches **zero** records against GBIF's real API, even in bounding boxes
with 200k+ occurrences in range. `buildGbifSpeciesUrl` in
`lib/habitat/parsers.ts` sends it as repeated params instead, with a
regression test (`tests/parsers.test.ts`) pinning the URL's shape — not
just its return type — because a "simplification" back to one comma-joined
value would pass a naive test while quietly reintroducing the bug.

## The "dominant pollutant" is a heuristic, not an official figure

Open-Meteo's free-tier API returns a composite US AQI but not its official
per-pollutant sub-index breakdown. `parseAirQuality` estimates which
pollutant is likely driving the reading by comparing each raw concentration
to a rough guideline reference value. It's a reasonable guess, clearly
labeled as such in `docs/METHODOLOGY.md` — treat it as directional, not
authoritative.

## No historical baseline, no anomaly detection

The climate snapshot shows today's numbers, not "hotter/colder/wetter than
normal for this date." Open-Meteo does expose a historical/climate-normal
API that could support that comparison; it wasn't in scope for this build.
Flagged here rather than silently implied by a color or an arrow.

## The 50km search radius doesn't unwrap the antimeridian or the poles

`boundingBoxAround` (see `lib/habitat/geo.ts`) builds a simple lat/lon box
scaled by `cos(latitude)`. For a habitat-scale radius (50km) this is
accurate almost everywhere, but it will quietly misbehave for a search
point extremely close to ±180° longitude or within a few degrees of the
poles. Not fixed for this build; a real deployment would switch to a
proper geodesic buffer.

## The pulse line is a summary, not a new measurement

Its color and height are fully determined by the AQI tier and species count
already shown in the cards below it (see `docs/METHODOLOGY.md`). It doesn't
encode anything the cards don't already say in words — it's there so the
state of a place is legible at a glance, with the caption underneath so
nothing is color-only.

## The logo's pulse line is branding, not data

The logo (a location pin sitting on a pulse line, in the header and as the
favicon) is fixed artwork. Unlike the real pulse line above the search
results, it is never derived from air-quality, weather, or species data —
it's identical on every page load and doesn't know what place you're about
to search. Don't wire it to the last search's numbers; that would blur a
distinction this project otherwise draws carefully everywhere else.

The hero image itself — an elephant in dense forest — is likewise a
photograph chosen for the theme, not a visualization of anything.

## The hero's motion behavior is a deliberate set of rules, not a default

Two independent conditions change how the scroll-expansion hero behaves,
decided by pure predicates in `lib/habitat/heroMotion.ts` (tested in
`tests/heroMotion.test.ts`):

- **`prefers-reduced-motion: reduce`** — the hero mounts fully expanded
  *and* the scroll-scrub is not attached at all. The page scrolls
  completely normally; the "Scroll to reveal" prompt is hidden, since it
  would be un-followable.
- **A `?lat=&lon=` deep link** — the hero mounts fully expanded so a
  shared/bookmarked result is visible immediately, but the scrub stays
  enabled, because following a link implies nothing about someone's motion
  preference.

Those two are deliberately *not* the same predicate, and collapsing them
into one would reintroduce a real bug: the hero's wheel/touch handlers
re-collapse a fully-expanded hero when the visitor scrolls up near the top
of the page, and its scroll handler pins the window to `scrollY` 0 while
collapsed. A reduced-motion visitor who merely *started* expanded would be
dragged straight back into the scroll-jacked animation they opted out of.
Starting expanded is necessary but not sufficient — the handlers must not
be attached in the first place.

## This is a snapshot tool, not a monitoring or alerting system

There's no persistence, no notifications, no tracking of a location over
time. Every load is a fresh, independent read of live public APIs. Building
that longitudinally (e.g. "alert me if AQI crosses 150 near this reserve")
is a natural next step, not something this submission claims to do.
