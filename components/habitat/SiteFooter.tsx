/**
 * SiteFooter.tsx — the attribution footer from the shipped app's
 * index.html, ported to React.
 */
const REPO = "https://github.com/rishikrrontala-bot/habitat-pulse";

export default function SiteFooter() {
  return (
    <footer className="mt-16 pt-6 border-t border-habitat-hairline text-habitat-ink-faint text-[13px] leading-[1.7]">
      <p>
        Data: air quality &amp; weather from{" "}
        <a href="https://open-meteo.com/" target="_blank" rel="noopener" className="text-habitat-ink-muted hover:text-habitat-mint">
          Open-Meteo
        </a>{" "}
        (CC BY 4.0), species occurrence &amp; IUCN Red List categories from the{" "}
        <a href="https://www.gbif.org/" target="_blank" rel="noopener" className="text-habitat-ink-muted hover:text-habitat-mint">
          Global Biodiversity Information Facility
        </a>
        . Built for{" "}
        <a href="https://hack-the-habitat-2026.devpost.com/" target="_blank" rel="noopener" className="text-habitat-ink-muted hover:text-habitat-mint">
          Hack the Habitat
        </a>
        . See{" "}
        <a href={`${REPO}/blob/main/docs/METHODOLOGY.md`} target="_blank" rel="noopener" className="text-habitat-ink-muted hover:text-habitat-mint">
          how the numbers are computed
        </a>{" "}
        and{" "}
        <a href={`${REPO}/blob/main/docs/LIMITATIONS.md`} target="_blank" rel="noopener" className="text-habitat-ink-muted hover:text-habitat-mint">
          what this tool can&rsquo;t tell you
        </a>
        .
      </p>
    </footer>
  );
}
