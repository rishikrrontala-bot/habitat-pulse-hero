<img src="public/branding/logo-wordmark.png" alt="Habitat Pulse" width="560">

**What's happening, right now, where you stand.** Search any place on Earth for its live air quality, current weather, and threatened species recorded nearby — pulled straight from public APIs, nothing invented, wrapped in a cinematic scroll-expansion hero.

**Live demo:** https://rishikrrontala-bot.github.io/habitat-pulse-hero/

Built for [Hack the Habitat](https://hack-the-habitat-2026.devpost.com/) — "Build tech that protects the planet."

## What it does

Scroll through an elephant-in-forest photograph that grows to fill the screen as you scroll — then the real tool underneath: search any place on Earth and get

1. **Air quality now** — live US AQI, a plain-language health read, and a best-effort read on which pollutant is driving it.
2. **A climate snapshot** — current temperature, humidity, wind, today's forecast range.
3. **Threatened species recorded within 50km** — IUCN Red List categories (Critically Endangered → Near Threatened) via GBIF's occurrence data, sorted by severity, each linking to its GBIF record.
4. **Specific, grounded actions** — never generic environmentalism filler, always tied to what was actually found.

No accounts, no API keys, nothing invented — if a number isn't real, it doesn't appear.

## Accessibility

The hero is scroll-driven, which makes motion preferences a correctness
issue rather than a nicety:

- **`prefers-reduced-motion: reduce`** — the hero mounts fully expanded and
  the scroll-scrub is never attached, so the page scrolls completely
  normally.
- **Deep links (`?lat=&lon=`)** — mount expanded so a shared result is
  visible immediately, but keep the scrub, since following a link says
  nothing about motion preference.

Those are separate tested predicates in `lib/habitat/heroMotion.ts`, not
one flag — merging them reintroduces a real bug (see `docs/LIMITATIONS.md`).
Search is a proper `combobox`/`listbox` with full keyboard support, and no
information is conveyed by color alone.

## Tech stack

- **Next.js 16** (App Router, Turbopack) + **React 19** + **TypeScript**
- **Tailwind CSS v4** + **shadcn** (`base-nova` preset) for the component/design-token pipeline
- **framer-motion** for the scroll-expansion hero's fade/scale transitions
- **Vitest** for the unit test suite (44 tests)
- No backend, no database — every data fetch is a direct client-side call to free, keyless public APIs

## Project structure

```
components/ui/
  scroll-expansion-hero.tsx   the pasted shadcn component (scroll-driven media expand)
  scroll-locked-video-hero.tsx an earlier hero variant (video-scrub), kept but not active
components/habitat/
  HabitatApp.tsx              search, autocomplete, keyboard nav, fetch orchestration
  ResultsSection.tsx          the real pulse line + air/climate/species cards + actions
  SiteHeader.tsx / SiteFooter.tsx   masthead nav + attribution
components/demo-scroll-expansion.tsx  wires the hero + the real app together (the homepage)
lib/habitat/
  geo.ts / parsers.ts / actions.ts    pure domain logic — bounding-box math, API
                                       parsing, and data→action mapping
  heroMotion.ts                       pure predicates for the hero's motion behavior
tests/                        Vitest suite covering every pure module above
```

`lib/habitat/parsers.ts` carries a hard-won fix: GBIF's `iucnRedListCategory` filter silently matches **zero** records if the categories are comma-joined in one value — it needs repeated query params instead. `buildGbifSpeciesUrl` sends it correctly, with a regression test pinning the URL *shape* so a "simplification" can't quietly reintroduce it. This one only surfaced by calling the real endpoint; it passed every test written against documented example responses.

## Running locally

```bash
npm install
npm run dev           # http://localhost:3000
npm test              # 44 passing
npm run build         # production build
npm run deploy:pages  # build + publish to GitHub Pages
```

## Attribution

- **Open-Meteo** — geocoding, weather, and air quality data. CC BY 4.0. https://open-meteo.com/
- **GBIF (Global Biodiversity Information Facility)** — species occurrence records and IUCN Red List category data. https://www.gbif.org/
- **Photography** — misty mountain sunrise ([direct image](https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05)) and elephant in forest ([direct image](https://images.unsplash.com/photo-1549366021-9f761d450615)) via Unsplash (Unsplash License, free to use — no page URL cited here since only the direct CDN links were verified, not a specific photo-page slug).
- **shadcn** (`base-nova` preset) — component/design-token scaffolding. https://ui.shadcn.com/
- **framer-motion** — animation library used by the scroll-expansion hero component. https://www.framer.com/motion/
- **Next.js**, **React**, **Tailwind CSS**, **TypeScript**, **Vitest** — the rest of the toolchain.
- Fonts: Fraunces, Inter, IBM Plex Mono via Google Fonts (Open Font License), loaded through `next/font/google`.

## License

MIT.
