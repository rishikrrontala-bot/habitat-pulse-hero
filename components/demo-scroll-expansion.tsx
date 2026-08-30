'use client';

import { useEffect } from 'react';
import ScrollExpandMedia from '@/components/ui/scroll-expansion-hero';

// Real, verified Unsplash photos (checked for both reachability and actual
// subject matter before use — see the conversation this was built in).
const BG_IMAGE =
  'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=1920&auto=format&fit=crop'; // misty green mountains at sunrise
const HERO_IMAGE =
  'https://images.unsplash.com/photo-1549366021-9f761d450615?q=80&w=1280&auto=format&fit=crop'; // elephant in dark forest

function HabitatPulseAbout() {
  return (
    <div className='max-w-4xl mx-auto'>
      <h2 className='text-3xl font-bold mb-6 text-white'>
        What Habitat Pulse actually shows you
      </h2>
      <p className='text-lg mb-8 text-neutral-300'>
        Search any place on Earth and get its live air quality, current
        weather, and nearby IUCN-threatened species occurrence records —
        pulled straight from Open-Meteo and GBIF. No accounts, no API keys,
        nothing invented. This elephant, photographed in the kind of dense
        habitat that&rsquo;s shrinking fastest, is a reminder of what the
        numbers underneath are actually about.
      </p>
      <p className='text-lg mb-8 text-neutral-300'>
        There&rsquo;s deliberately no single &ldquo;habitat score.&rdquo; Air
        quality this minute and multi-year species occurrence records
        measure fundamentally different things — collapsing them into one
        number would fake a precision the data doesn&rsquo;t have.
      </p>
    </div>
  );
}

export default function HabitatPulseScrollHero() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className='min-h-screen bg-black'>
      <ScrollExpandMedia
        mediaType='image'
        mediaSrc={HERO_IMAGE}
        bgImageSrc={BG_IMAGE}
        title='Every Place Has A Pulse'
        date='Somewhere, right now'
        scrollToExpand='Scroll to reveal the signal'
        textBlend
      >
        <HabitatPulseAbout />
      </ScrollExpandMedia>
    </div>
  );
}
