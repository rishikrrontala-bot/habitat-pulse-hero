'use client';

import { useEffect, useState } from 'react';
import ScrollExpandMedia from '@/components/ui/scroll-expansion-hero';
import SiteHeader from '@/components/habitat/SiteHeader';
import HabitatApp from '@/components/habitat/HabitatApp';
import SiteFooter from '@/components/habitat/SiteFooter';

// Real, verified Unsplash photos (checked for both reachability and actual
// subject matter before use — see the conversation this was built in).
const BG_IMAGE =
  'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=1920&auto=format&fit=crop'; // misty green mountains at sunrise
const HERO_IMAGE =
  'https://images.unsplash.com/photo-1549366021-9f761d450615?q=80&w=1280&auto=format&fit=crop'; // elephant in dark forest

export default function HabitatPulseScrollHero() {
  // A deep link (?lat=&lon=&name=, e.g. a shared/bookmarked result) means
  // HabitatApp will load and render real data immediately — start the hero
  // already expanded so that data is actually visible right away, instead
  // of sitting at opacity:0 behind an unscrolled hero. `null` until the
  // client-only check runs, so the very first render (server + first
  // paint) always matches the default collapsed state and avoids a
  // hydration mismatch.
  const [startExpanded, setStartExpanded] = useState<boolean | null>(null);

  /* eslint-disable react-hooks/set-state-in-effect --
   * Reading window.location for a deep-link check genuinely requires an
   * effect: there's no window during server rendering, and this must run
   * once, client-side, on mount. Syncing from an external source (the
   * URL), not deriving state that could be computed from props. */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hasDeepLink = params.has('lat') && params.has('lon');
    setStartExpanded(hasDeepLink);
    if (!hasDeepLink) window.scrollTo(0, 0);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Same background color as the hero itself, both before and after this
  // resolves — a plain `null` here would flash blank (server HTML has no
  // window to check) for every visitor, not just deep links, for the one
  // render between hydration and this effect running.
  if (startExpanded === null) return <div className="min-h-screen bg-black" />;

  return (
    <div className="min-h-screen bg-black">
      <ScrollExpandMedia
        mediaType="image"
        mediaSrc={HERO_IMAGE}
        bgImageSrc={BG_IMAGE}
        title="Every Place Has A Pulse"
        date="Somewhere, right now"
        scrollToExpand="Scroll to reveal the signal"
        textBlend
        startExpanded={startExpanded}
      >
        <div className="max-w-[920px] mx-auto w-full px-2 md:px-4">
          <SiteHeader />
          <HabitatApp />
          <SiteFooter />
        </div>
      </ScrollExpandMedia>
    </div>
  );
}
