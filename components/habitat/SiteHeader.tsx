/**
 * SiteHeader.tsx — the masthead nav from the shipped app's index.html,
 * ported to React. Links point at the real shipped repo's docs, since
 * this sandbox project doesn't duplicate those markdown files.
 */
const REPO = "https://github.com/rishikrrontala-bot/habitat-pulse";

export default function SiteHeader() {
  return (
    <header className="flex items-baseline justify-between gap-4 mb-10 flex-wrap">
      <a href="#" className="font-[family-name:var(--font-display)] font-semibold text-[22px] tracking-[0.01em] text-habitat-ink no-underline">
        Habitat<span className="text-habitat-mint">Pulse</span>
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
