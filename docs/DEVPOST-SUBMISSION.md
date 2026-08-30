# Devpost submission — paste-ready copy

**Project name:** Habitat Pulse

**Elevator pitch (138/200 chars):** What's happening, right now, where you
stand: live air quality, weather, and threatened species for any place on
Earth — nothing invented.

**Live demo:** https://rishikrrontala-bot.github.io/habitat-pulse-hero/
**Source:** https://github.com/rishikrrontala-bot/habitat-pulse-hero

---

## Inspiration

Most environmental-awareness apps do one of two things: dump raw data on
you with no context, or flatten everything into a single feel-good "eco
score" that doesn't actually mean anything. Neither helps someone standing
in a specific place answer a specific question: *is the air I'm breathing
right now okay, and is there something worth protecting nearby that I don't
know about?* Habitat Pulse is built to answer exactly that, with real data
and honest framing instead of a manufactured score.

## What it does

You land on a full-screen photograph that expands as you scroll — an
elephant in dense forest, the kind of habitat that's shrinking fastest —
which opens into the actual tool. Search any place (a city, a park, a
reserve) and Habitat Pulse shows:

1. **Air quality now**, with the live US AQI, a plain-language health read,
   and a best-effort read on which pollutant is driving it.
2. **A climate snapshot** — current temperature, humidity, wind, and
   today's forecast range.
3. **Threatened species recorded within 50km**, filtered to IUCN Red List
   categories (Critically Endangered through Near Threatened) via GBIF's
   occurrence data, sorted by severity, each linking to its GBIF record.
4. **Specific, grounded actions** — never generic environmentalism filler,
   always tied to what was actually found (e.g. "air quality is unhealthy
   for sensitive groups, driven by PM2.5, here's what that means" or "a
   Vulnerable species has a record 12km away — here's its GBIF page").

A single animated "pulse" line summarizes both live signals at a glance —
color from air quality, height from nearby species risk — with a plain-text
caption underneath so nothing depends on color alone.

Search a shared link (`?lat=&lon=&name=`) and the hero starts already
expanded, so a bookmarked result is visible immediately instead of making
you scroll through an animation first.

## How we built it

Next.js 16 (App Router) with React 19 and TypeScript, styled with Tailwind
CSS v4 and scaffolded through the shadcn CLI, with framer-motion driving
the scroll-expansion hero's transitions. It ships as a fully static export
to GitHub Pages — no server, no backend, no database. Every data fetch is a
direct client-side call to free, keyless public APIs:
[Open-Meteo](https://open-meteo.com/) for geocoding, weather, and air
quality, and [GBIF](https://www.gbif.org/) for species occurrence records
filtered by IUCN Red List category.

The logic is deliberately split from the rendering. Pure functions in
`lib/habitat/geo.ts`, `parsers.ts`, and `actions.ts` handle all the real
domain logic — bounding-box math, AQI classification, species
deduplication and severity sorting, and the mapping from observed data to
recommended actions — and are covered by a 36-test Vitest suite.
`components/habitat/HabitatApp.tsx` and `ResultsSection.tsx` are the thin
state/fetch/render glue on top.

That split came from an earlier vanilla-JS build of the same idea, and the
logic was **ported over rather than re-derived** — so the scroll-expansion
hero isn't a prettier shell around placeholder text, it's the same tested
code underneath.

## Challenges we ran into

- **A live-API bug that only live verification could catch.** GBIF's
  `iucnRedListCategory` filter silently rejects a comma-joined list of
  categories (`CR,EN,VU,NT`) — it matches *zero* records for that form,
  confirmed against the real API in bounding boxes with 200k+ occurrences
  in range. It wants the four categories as repeated query params instead.
  Before we caught this, the species feature — the actual conservation
  half of the app — was quietly returning "none found" everywhere, always,
  indistinguishable from a genuine zero. No amount of testing against
  documented example responses would have caught it; only a real call to
  the real endpoint did. Fixed and pinned with a regression test that
  checks the URL's *shape*, not just its return type.
- **Not overclaiming.** GBIF species occurrence records are historical
  sightings, not a live presence feed — a record from 2019 doesn't mean
  the species is there today. We say that explicitly in the UI and in
  `docs/LIMITATIONS.md` rather than letting the feature imply more
  certainty than the data supports.
- **"We don't know" and "we checked, there's nothing" are different
  claims.** A failed species request and a *successful* request that found
  zero species originally rendered the same "no threatened species found"
  message. Only the second one has earned that reassurance. The
  `null`-vs-`[]` distinction is preserved everywhere and pinned by a
  regression test.
- **One bad API shouldn't blank the page.** All three data sources are
  fetched in parallel with `Promise.allSettled`, and the UI renders
  whatever succeeded while clearly marking what didn't.
- **Longitude isn't a constant-size unit.** A naive 50km bounding box in
  degrees would be wildly wrong near the poles. `boundingBoxAround` scales
  the longitude span by `cos(latitude)` and is unit-tested against that
  exact property.
- **"Skip the animation" is two decisions, not one.** Honoring
  `prefers-reduced-motion` by starting the hero already-expanded looked
  correct and wasn't: the hero's wheel handler re-collapses an expanded
  hero when you scroll up near the top, so a reduced-motion visitor got
  dragged right back into the scroll-jacked animation they'd opted out of.
  The fix required a second, independent decision — don't attach the scrub
  handlers at all — kept as separate tested predicates so the two can't be
  merged back together by a future "simplification."
- **Static export has sharp edges.** GitHub Pages serves project sites from
  a subpath, and `next/image` in unoptimized mode (required for a static
  export) doesn't apply `basePath` to local assets — so the logo 404'd on
  the live site while working perfectly in local dev. Caught by checking
  the deployed URL rather than trusting the dev server, then fixed and
  verified by serving the built export at the real subpath locally.

## Accomplishments we're proud of

A genuinely useful, honest tool with real test coverage — not a demo that
only works for one hardcoded city. Every judgement call about what the data
can and can't tell you is written down in `docs/LIMITATIONS.md`, including
the gaps that aren't fixed yet. The cinematic hero doesn't come at the cost
of the substance underneath it.

## What we learned

That resisting the urge to compress everything into one flashy score is
harder — and more useful — than building the score. That GBIF's IUCN Red
List integration is a genuinely underused free resource for location-aware
conservation tooling. And that a bug can pass every unit test you wrote and
still be completely broken in production — the GBIF filter issue was
invisible until we called the real endpoint.

## What's next

A historical/climate-normal comparison (Open-Meteo exposes this, so
"hotter than normal for this date" is within reach), a proper geodesic
search radius instead of a bounding box — the current one is accurate
everywhere except very close to the poles or the antimeridian — and
location-tracking alerts ("notify me if AQI near this reserve crosses a
threshold") as a natural extension of the snapshot-only model shipped
here. All three are listed honestly in `docs/LIMITATIONS.md` as things the
tool does *not* currently do.

## Built with

TypeScript · React 19 · Next.js 16 · Tailwind CSS v4 · shadcn ·
framer-motion · Vitest · Open-Meteo API · GBIF API · GitHub Pages

---

## Attribution (for the submission's required attribution field)

**Data sources**
- **Open-Meteo** — geocoding, weather, and air quality data. CC BY 4.0.
  https://open-meteo.com/
- **GBIF (Global Biodiversity Information Facility)** — species occurrence
  records and IUCN Red List category data. https://www.gbif.org/

**Libraries & tooling**
- **Next.js**, **React**, **TypeScript** — application framework and language.
- **Tailwind CSS** — styling. https://tailwindcss.com/
- **shadcn** (`base-nova` preset) — component/design-token scaffolding.
  https://ui.shadcn.com/
- **framer-motion** — animation library used by the scroll-expansion hero.
  https://www.framer.com/motion/
- **Vitest** — unit test runner. https://vitest.dev/

**Media & fonts**
- **Photography** — two images via Unsplash (Unsplash License, free to
  use): a misty mountain sunrise and an elephant in forest.
  https://unsplash.com/
- **Fonts** — Fraunces, Inter, and IBM Plex Mono via Google Fonts (Open
  Font License), loaded through `next/font/google`.

**Original work**
- The Habitat Pulse logo (a location pin on a pulse line) is original
  artwork made for this project, not sourced from a third party.
- All application logic, layout, and copy is original to this project.
