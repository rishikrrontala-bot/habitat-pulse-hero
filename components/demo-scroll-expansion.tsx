'use client';

import { useEffect, useState } from 'react';
import ScrollExpandMedia from '@/components/ui/scroll-expansion-hero';
import SiteHeader from '@/components/habitat/SiteHeader';
import HabitatApp from '@/components/habitat/HabitatApp';
import SiteFooter from '@/components/habitat/SiteFooter';
import {
  shouldStartExpanded,
  shouldEnableScrollScrub,
  type HeroMotionContext,
} from '@/lib/habitat/heroMotion';

// Real, verified Unsplash photos (checked for both reachability and actual
// subject matter before use — see the conversation this was built in).
const BG_IMAGE =
  'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=1920&auto=format&fit=crop'; // misty green mountains at sunrise
const HERO_IMAGE =
  'https://images.unsplash.com/photo-1549366021-9f761d450615?q=80&w=1280&auto=format&fit=crop'; // elephant in dark forest

export default function HabitatPulseScrollHero() {
  // Two independent questions, answered by pure predicates in
  // lib/habitat/heroMotion.ts (with tests):
  //   - should the hero mount already expanded?  (deep link OR reduced motion)
  //   - should the scroll-scrub run at all?      (NOT reduced motion)
  // They are not the same question — see heroMotion.ts for why collapsing
  // them into one reintroduces a real accessibility bug.
  //
  // `null` until the client-only check runs, so the first render (server +
  // first paint) is deterministic and can't cause a hydration mismatch.
  const [motion, setMotion] = useState<HeroMotionContext | null>(null);

  // Reading window.location and window.matchMedia genuinely requires an
  // effect: neither exists during server rendering, and both must be read
  // client-side on mount. This syncs from external sources (the URL and an
  // OS accessibility setting) via a subscription callback — the shape
  // react-hooks/set-state-in-effect actually wants — rather than deriving
  // state that could have been computed from props.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hasDeepLink = params.has('lat') && params.has('lon');
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');

    const sync = () => setMotion({ prefersReducedMotion: mq.matches, hasDeepLink });
    sync();

    // Respect the preference being toggled mid-session, not just at load.
    mq.addEventListener('change', sync);

    if (!hasDeepLink && !mq.matches) window.scrollTo(0, 0);
    return () => mq.removeEventListener('change', sync);
  }, []);

  // Same background color as the hero itself, both before and after this
  // resolves — a plain `null` here would flash blank (server HTML has no
  // window to check) for every visitor, not just deep links, for the one
  // render between hydration and this effect running.
  if (motion === null) return <div className="min-h-screen bg-black" />;

  return (
    <div className="min-h-screen bg-black">
      <ScrollExpandMedia
        mediaType="image"
        mediaSrc={HERO_IMAGE}
        bgImageSrc={BG_IMAGE}
        title="Every Place Has A Pulse"
        date="Somewhere, right now"
        // Under reduced motion the hero is already open, so a "Scroll to
        // reveal" instruction would be both wrong and un-followable.
        scrollToExpand={
          motion.prefersReducedMotion ? undefined : 'Scroll to reveal the signal'
        }
        textBlend
        startExpanded={shouldStartExpanded(motion)}
        disableScrollScrub={!shouldEnableScrollScrub(motion)}
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
