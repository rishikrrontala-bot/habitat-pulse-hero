/**
 * actions.ts — deterministic mapping from what was observed to what a
 * visitor could actually do about it. Pure function: same inputs, same
 * output, no randomness, no fetch. Every action is grounded in a specific
 * data source, not generic environmentalism filler. Ported 1:1 from the
 * shipped habitat-pulse app's src/actions.js, with types added.
 */
import type { AirQuality } from "./parsers";
import type { Species } from "./parsers";

export interface ActionItem {
  id: string;
  text: string;
  href?: string;
  linkText?: string;
}

export interface BuildActionItemsInput {
  airQuality: AirQuality | null | undefined;
  species: Species[] | null;
  locationLabel?: string;
}

export function buildActionItems({ airQuality, species, locationLabel }: BuildActionItemsInput): ActionItem[] {
  const actions: ActionItem[] = [];

  if (airQuality && airQuality.hasData) {
    if (airQuality.level === "unhealthy-sensitive" || airQuality.level === "unhealthy") {
      actions.push({
        id: "aqi-limit-exertion",
        text: `Air quality is ${airQuality.levelLabel.toLowerCase()} right now${airQuality.dominantPollutant ? ` (${airQuality.dominantPollutant} is the biggest factor)` : ""}. If you're in a sensitive group, move workouts indoors today.`,
        href: "https://www.airnow.gov/aqi/aqi-basics/",
        linkText: "How to read the AQI",
      });
    } else if (airQuality.level === "very-unhealthy" || airQuality.level === "hazardous") {
      actions.push({
        id: "aqi-avoid-exertion",
        text: `Air quality is ${airQuality.levelLabel.toLowerCase()}. Avoid outdoor exertion and keep windows closed if you're near ${locationLabel || "this location"}.`,
        href: "https://www.airnow.gov/aqi/aqi-basics/",
        linkText: "How to read the AQI",
      });
    } else if (airQuality.level === "good") {
      actions.push({
        id: "aqi-good",
        text: "Air quality is good right now — a reasonable day to log outdoor observations for a citizen-science project.",
        href: "https://www.inaturalist.org/",
        linkText: "Log a sighting on iNaturalist",
      });
    }
  }

  // species === null means the GBIF request itself failed — distinct from
  // species === [] which means it succeeded and found nothing. Only the
  // latter earns the reassuring empty-state copy; the former stays silent
  // rather than implying a result we don't actually have.
  if (Array.isArray(species) && species.length > 0) {
    const mostSevere = species[0];
    actions.push({
      id: "species-report",
      text: `GBIF has ${species.length} threatened-species record${species.length === 1 ? "" : "s"} within range, most urgently ${mostSevere.vernacularName || mostSevere.scientificName} (${mostSevere.categoryLabel}). If you spot it, a logged, photographed sighting is real conservation data.`,
      href: mostSevere.gbifUrl,
      linkText: `View ${mostSevere.vernacularName || mostSevere.scientificName} on GBIF`,
    });
    actions.push({
      id: "species-redlist",
      text: 'Read what "threatened" actually means for these species and what drives their risk category.',
      href: "https://www.iucnredlist.org/",
      linkText: "Browse the IUCN Red List",
    });
  } else if (Array.isArray(species) && species.length === 0) {
    actions.push({
      id: "species-none-found",
      text: "No threatened-species occurrence records turned up in GBIF near this point. That can mean genuinely low pressure locally — or that the area is undersurveyed. Contributing a sighting helps close that gap either way.",
      href: "https://www.gbif.org/participant",
      linkText: "How GBIF data gets collected",
    });
  }

  return actions;
}
