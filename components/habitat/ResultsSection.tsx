"use client";

/**
 * ResultsSection.tsx — the real pulse line + data cards + actions list,
 * ported from the shipped app's render()/paintPulse()/renderAirCard()/
 * renderClimateCard()/renderSpeciesCard()/renderActions() (src/app.js).
 *
 * Distinct from the decorative scroll-hero waveform above: every number
 * here is a direct function of live API data, never invented. See
 * lib/habitat/parsers.ts and lib/habitat/actions.ts for the pure logic.
 */
import { useMemo } from "react";
import type { AirQuality, Weather, Species } from "@/lib/habitat/parsers";
import type { ActionItem } from "@/lib/habitat/actions";

const SPECIES_RADIUS_KM = 50;
const SPECIES_YEARS_BACK = 15;

const LEVEL_COLOR_MAP: Record<string, string> = {
  good: "#6ee7b7",
  moderate: "#f4b860",
  "unhealthy-sensitive": "#ff6b5b",
  unhealthy: "#ff6b5b",
  "very-unhealthy": "#ff6b5b",
  hazardous: "#ff6b5b",
  unknown: "#6c8b7d",
};

const LEVEL_BADGE_CLASSES: Record<string, string> = {
  good: "bg-[rgba(110,231,183,0.14)] text-habitat-mint",
  moderate: "bg-[rgba(244,184,96,0.14)] text-habitat-amber",
  "unhealthy-sensitive": "bg-[rgba(255,107,91,0.14)] text-habitat-coral",
  unhealthy: "bg-[rgba(255,107,91,0.14)] text-habitat-coral",
  "very-unhealthy": "bg-[rgba(255,107,91,0.22)] text-habitat-coral",
  hazardous: "bg-[rgba(255,107,91,0.22)] text-habitat-coral",
  unknown: "bg-[rgba(159,199,182,0.12)] text-habitat-ink-faint",
};

const CAT_TAG_CLASSES: Record<string, string> = {
  CR: "bg-[rgba(255,107,91,0.22)] text-habitat-coral",
  EN: "bg-[rgba(255,107,91,0.14)] text-habitat-coral",
  VU: "bg-[rgba(244,184,96,0.16)] text-habitat-amber",
  NT: "bg-[rgba(159,199,182,0.16)] text-habitat-ink-muted",
};

function buildPulsePath(amplitude: number): string {
  const width = 600;
  const height = 64;
  const mid = height / 2;
  const points = 8;
  let d = `M 0 ${mid}`;
  for (let i = 1; i <= points; i++) {
    const x = (width / points) * i;
    const up = i % 2 === 0;
    const y = mid + (up ? -amplitude : amplitude) * (i === points ? 0.3 : 1);
    d += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  return d;
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <article className="bg-habitat-surface border border-habitat-hairline rounded-[14px] p-5">
      <h3 className="text-[13px] uppercase tracking-[0.08em] text-habitat-ink-faint mb-3.5">{title}</h3>
      {children}
    </article>
  );
}

function EmptyNote({ message }: { message: string }) {
  return <p className="text-habitat-ink-muted text-sm leading-relaxed">{message}</p>;
}

interface ResultsSectionProps {
  location: { name: string };
  locationMeta: string;
  weather: Weather | null;
  air: AirQuality | null;
  species: Species[] | null;
  actions: ActionItem[];
}

export default function ResultsSection({ location, locationMeta, weather, air, species, actions }: ResultsSectionProps) {
  const level = air?.level ?? "unknown";
  const color = LEVEL_COLOR_MAP[level] || "#6c8b7d";
  const speciesCount = species ? species.length : 0;
  const amplitude = Math.min(22, 6 + speciesCount * 3);
  const pulsePath = useMemo(() => buildPulsePath(amplitude), [amplitude]);
  const speciesNote =
    species === null ? "species data unavailable" : `${speciesCount} threatened-species record${speciesCount === 1 ? "" : "s"} nearby`;

  return (
    <section className="pt-4" aria-labelledby="location-name">
      <div className="flex justify-between items-end flex-wrap gap-3 border-b border-habitat-hairline pb-5 mb-6">
        <div>
          <h2 id="location-name" className="font-[family-name:var(--font-display)] font-medium text-[30px] mb-1 text-habitat-ink">
            {location.name}
          </h2>
          <div className="font-[family-name:var(--font-habitat-mono)] text-[13px] text-habitat-ink-faint">{locationMeta}</div>
        </div>
      </div>

      <div
        className="my-5 mb-8 border border-habitat-hairline rounded-[14px] bg-habitat-surface px-5 pt-4.5 pb-2.5"
        role="img"
        aria-label="Habitat pulse: a visual summary combining live air quality and nearby threatened-species signal"
      >
        <svg viewBox="0 0 600 64" preserveAspectRatio="none" aria-hidden="true" className="w-full h-16 block">
          <path d={pulsePath} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div className="font-[family-name:var(--font-habitat-mono)] text-xs text-habitat-ink-faint mt-1.5">
          Line color reflects live air quality ({air?.hasData ? air.levelLabel : "no data"}); height reflects {speciesNote}.
        </div>
      </div>

      <div className="grid gap-4 mb-7" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
        <Card title="Air quality now">
          {!air?.hasData ? (
            <EmptyNote message="Air quality data unavailable for this location right now." />
          ) : (
            <>
              <div className="font-[family-name:var(--font-habitat-mono)] text-4xl font-semibold leading-none mb-1.5 text-habitat-ink">
                {air.aqi}
                <span className="text-base text-habitat-ink-faint font-normal"> US AQI</span>
              </div>
              <span className={`inline-flex items-center gap-1.5 text-[13px] font-semibold px-2.5 py-1 rounded-full mb-2.5 ${LEVEL_BADGE_CLASSES[level]}`}>
                <span aria-hidden="true">●</span> {air.levelLabel}
              </span>
              <p className="text-habitat-ink-muted text-sm">{air.advice}</p>
              {air.dominantPollutant && (
                <p className="mt-2 text-[13px] text-habitat-ink-muted">
                  Likely driven by <strong className="text-habitat-ink">{air.dominantPollutant}</strong>.
                </p>
              )}
              <ul className="list-none mt-3 p-0 grid grid-cols-2 gap-x-3.5 gap-y-1.5 font-[family-name:var(--font-habitat-mono)] text-[12.5px] text-habitat-ink-muted">
                {air.pollutants.map((p) => (
                  <li key={p.key}>
                    {p.label}
                    <span aria-hidden="true"> — </span>
                    {p.value.toFixed(1)}
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>

        <Card title="Climate snapshot">
          {!weather?.hasData ? (
            <EmptyNote message="Weather data unavailable for this location right now." />
          ) : (
            <>
              <div className="font-[family-name:var(--font-habitat-mono)] text-4xl font-semibold leading-none mb-1.5 text-habitat-ink">
                {weather.tempC!.toFixed(1)}°<span className="text-base text-habitat-ink-faint font-normal">C</span>
              </div>
              <p className="text-habitat-ink-muted text-sm">
                {weather.todayMinC !== null && weather.todayMaxC !== null && `Today's range ${weather.todayMinC.toFixed(0)}°–${weather.todayMaxC.toFixed(0)}°C.`}
                {weather.humidityPct !== null && ` Humidity ${weather.humidityPct}%.`}
                {weather.windKmh !== null && ` Wind ${weather.windKmh.toFixed(0)} km/h.`}
                {weather.precipMm !== null && weather.precipMm > 0 && ` ${weather.precipMm.toFixed(1)}mm precipitation now.`}
              </p>
            </>
          )}
        </Card>

        <Card title={`Threatened species recorded within ${SPECIES_RADIUS_KM}km`}>
          {species === null ? (
            <EmptyNote message="GBIF species data unavailable right now — this source didn't respond." />
          ) : species.length === 0 ? (
            <EmptyNote
              message={`No threatened-species occurrence records within ${SPECIES_RADIUS_KM}km in GBIF's database over the last ${SPECIES_YEARS_BACK} years. That can mean genuinely low pressure here — or that this area is undersurveyed; GBIF coverage varies a lot by region.`}
            />
          ) : (
            <>
              <ul className="list-none m-0 p-0">
                {species.slice(0, 8).map((s, i) => (
                  <li key={`${s.taxonKey}`} className={`py-3 ${i === 0 ? "" : "border-t border-habitat-hairline"}`}>
                    <span className={`inline-block text-[11px] font-bold tracking-[0.04em] px-1.5 py-0.5 rounded mr-1.5 ${CAT_TAG_CLASSES[s.category] || ""}`}>
                      {s.category}
                    </span>
                    <span className="font-semibold text-habitat-ink">{s.vernacularName || s.scientificName}</span>
                    {s.vernacularName && <div className="italic text-habitat-ink-faint text-[13px]">{s.scientificName}</div>}
                    <div className="font-[family-name:var(--font-habitat-mono)] text-xs text-habitat-ink-faint mt-0.5">
                      {s.categoryLabel}
                      {s.lastSeenYear ? ` · last recorded ${s.lastSeenYear}` : ""}
                      {s.distanceKm !== null ? ` · ~${s.distanceKm.toFixed(0)}km away` : ""} ·{" "}
                      <a href={s.gbifUrl} target="_blank" rel="noopener" className="text-habitat-mint hover:text-[#9df5cf]">
                        GBIF record
                      </a>
                    </div>
                  </li>
                ))}
              </ul>
              {species.length > 8 && (
                <p className="mt-2.5 text-[13px] text-habitat-ink-faint">+ {species.length - 8} more within {SPECIES_RADIUS_KM}km.</p>
              )}
            </>
          )}
        </Card>
      </div>

      <div>
        <h3 className="font-[family-name:var(--font-display)] font-medium text-xl mb-3.5 text-habitat-ink">What you can do here</h3>
        <ul className="list-none m-0 p-0 grid gap-2.5">
          {actions.length === 0 ? (
            <li className="bg-habitat-surface border border-habitat-hairline border-l-[3px] border-l-habitat-mint rounded-[10px] px-4 py-3.5 text-[14.5px] text-habitat-ink-muted">
              None of the live data sources responded, so there&rsquo;s nothing to base a recommendation on. Try again in a moment.
            </li>
          ) : (
            actions.map((a) => (
              <li key={a.id} className="bg-habitat-surface border border-habitat-hairline border-l-[3px] border-l-habitat-mint rounded-[10px] px-4 py-3.5 text-[14.5px] text-habitat-ink-muted">
                {a.text}
                {a.href && (
                  <>
                    {" "}
                    <a href={a.href} target="_blank" rel="noopener" className="font-semibold text-habitat-mint hover:text-[#9df5cf]">
                      {a.linkText || "Learn more"} →
                    </a>
                  </>
                )}
              </li>
            ))
          )}
        </ul>
      </div>
    </section>
  );
}
