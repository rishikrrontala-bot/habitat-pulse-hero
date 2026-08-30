/**
 * SiteHeader.tsx — the masthead nav from the shipped app's index.html,
 * ported to React, now pointing at this repo (the actual submission) and
 * its own copied docs, plus the real logo.
 */
import Image from "next/image";

const REPO = "https://github.com/rishikrrontala-bot/habitat-pulse-hero";
// images.unoptimized:true (required for the GitHub Pages static export)
// makes next/image emit a plain <img>, which does NOT auto-prefix local
// /public asset URLs with basePath the way the optimized-image proxy
// route would — has to be prepended by hand. See next.config.ts.
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

export default function SiteHeader() {
  return (
    <header className="flex items-baseline justify-between gap-4 mb-10 flex-wrap">
      <a href="#" className="flex items-center gap-2 no-underline">
        <Image src={`${BASE_PATH}/branding/logo.png`} alt="" width={28} height={28} className="rounded-[7px]" priority />
        <span className="font-[family-name:var(--font-display)] font-semibold text-[22px] tracking-[0.01em] text-habitat-ink">
          Habitat<span className="text-habitat-mint">Pulse</span>
        </span>
      </a>
      <nav aria-label="Project links" className="flex gap-5">
        <a href={`${REPO}/blob/main/docs/METHODOLOGY.md`} target="_blank" rel="noopener" className="text-habitat-ink-muted text-sm no-underline hover:text-habitat-ink">
          Methodology
        </a>
        <a href={`${REPO}/blob/main/docs/LIMITATIONS.md`} target="_blank" rel="noopener" className="text-habitat-ink-muted text-sm no-underline hover:text-habitat-ink">
          Limitations
        </a>
        <a href={REPO} target="_blank" rel="noopener" className="text-habitat-ink-muted text-sm no-underline hover:text-habitat-ink">
          Source
        </a>
      </nav>
    </header>
  );
}
