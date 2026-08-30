# Habitat Pulse — scroll-expansion edition

**A Next.js/TypeScript/shadcn build of [Habitat Pulse](https://github.com/rishikrrontala-bot/habitat-pulse)** — same real, live data (air quality, weather, and threatened species for any place on Earth), same honest framing, reimagined with a cinematic scroll-expansion hero on top.

Built for [Hack the Habitat](https://hack-the-habitat-2026.devpost.com/) — "Build tech that protects the planet." The [original vanilla-JS build](https://github.com/rishikrrontala-bot/habitat-pulse) is the primary submission; this is an exploration of the same idea with a shadcn/React component pipeline, kept in a separate repo so neither could break the other.

## What it does

Scroll through an elephant-in-forest photograph that grows to fill the screen as you scroll — then the real tool underneath: search any place on Earth and get

1. **Air quality now** — live US AQI, a plain-language health read, and a best-effort read on which pollutant is driving it.
2. **A climate snapshot** — current temperature, humidity, wind, today's forecast range.
3. **Threatened species recorded within 50km** — IUCN Red List categories (Critically Endangered → Near Threatened) via GBIF's occurrence data, sorted by severity, each linking to its GBIF record.
4. **Specific, grounded actions** — never generic environmentalism filler, always tied to what was actually found.

No accounts, no API keys, nothing invented. Same rule as the original: if a number isn't real, it doesn't appear.

## Why a separate repo from the same idea

The original [habitat-pulse](https://github.com/rishikrrontala-bot/habitat-pulse) is deliberately zero-dependency, zero-build-step vanilla JS — a real, considered constraint, not an oversight (see that repo's `CLAUDE.md`). Rebuilding its hero with a pasted shadcn/React component meant either migrating the shipped, already-verified submission's entire toolchain days before a deadline, or building the same idea in an isolated sandbox instead. This is that sandbox: real Next.js, TypeScript, Tailwind, and shadcn, with the actual app logic ported over (not re-derived) so it isn't just a prettier shell around placeholder text.

## Tech stack

- **Next.js 16** (App Router, Turbopack) + **React 19** + **TypeScript**
- **Tailwind CSS v4** + **shadcn** (`base-nova` preset) for the component/design-token pipeline
- **framer-motion** for the scroll-expansion hero's fade/scale transitions
- **Vitest** for the ported unit test suite (36 tests)
- No backend, no database — every data fetch is a direct client-side call to the same public APIs the original uses

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
  geo.ts / parsers.ts / actions.ts    pure domain logic, ported 1:1 from the original's
                                       src/*.js with types added — see tests/ for coverage
tests/                        Vitest suite mirroring the original's test coverage
```

`lib/habitat/parsers.ts` carries forward a real bug fix from the original project: GBIF's `iucnRedListCategory` filter silently matches zero records if the categories are comma-joined in one value — it needs repeated query params instead. `buildGbifSpeciesUrl` sends it correctly, with a regression test pinning the URL shape so a "simplification" can't quietly reintroduce it.

## Running locally

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # 36 passing
npm run build    # production build
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
