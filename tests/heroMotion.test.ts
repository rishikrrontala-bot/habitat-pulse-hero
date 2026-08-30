import { describe, test, expect } from "vitest";
import { shouldStartExpanded, shouldEnableScrollScrub } from "@/lib/habitat/heroMotion";

describe("shouldStartExpanded", () => {
  test("a normal first-time visitor gets the collapsed, scrubable hero", () => {
    expect(shouldStartExpanded({ prefersReducedMotion: false, hasDeepLink: false })).toBe(false);
  });

  test("reduced motion starts expanded (show the animation's end state, not a half-open one)", () => {
    expect(shouldStartExpanded({ prefersReducedMotion: true, hasDeepLink: false })).toBe(true);
  });

  // Regression guard. Deep links WERE made to start expanded, on the theory
  // that a shared result should be visible without scrubbing. In practice it
  // dropped the visitor onto a full-screen hero image (the end of the
  // animation) with the data still ~1500px below the fold — it read as
  // broken and denied shared links the intro everyone else gets. Deep links
  // now get the normal experience; the data is loaded and waiting underneath.
  test("a deep link does NOT start expanded — it gets the normal intro", () => {
    expect(shouldStartExpanded({ prefersReducedMotion: false, hasDeepLink: true })).toBe(false);
  });

  test("reduced motion still wins even when a deep link is present", () => {
    expect(shouldStartExpanded({ prefersReducedMotion: true, hasDeepLink: true })).toBe(true);
  });
});

describe("shouldEnableScrollScrub", () => {
  test("enabled for a normal visitor", () => {
    expect(shouldEnableScrollScrub({ prefersReducedMotion: false, hasDeepLink: false })).toBe(true);
  });

  test("disabled under reduced motion", () => {
    expect(shouldEnableScrollScrub({ prefersReducedMotion: true, hasDeepLink: false })).toBe(false);
  });

  // The regression this whole module exists to prevent. The hero's wheel
  // handler re-collapses an expanded hero when the visitor scrolls up near
  // the top, and its scroll handler pins scrollY to 0 while collapsed. So
  // "start expanded" is NOT sufficient for reduced motion on its own — the
  // visitor would get pulled back into the scroll-jacked animation they
  // explicitly opted out of. These two predicates must stay independent.
  test("reduced motion disables the scrub even though it also starts expanded", () => {
    const ctx = { prefersReducedMotion: true, hasDeepLink: false };
    expect(shouldStartExpanded(ctx)).toBe(true);
    expect(shouldEnableScrollScrub(ctx)).toBe(false);
  });

  test("a deep link is treated exactly like a normal visit — collapsed, scrub on", () => {
    const deepLink = { prefersReducedMotion: false, hasDeepLink: true };
    const normal = { prefersReducedMotion: false, hasDeepLink: false };
    expect(shouldStartExpanded(deepLink)).toBe(shouldStartExpanded(normal));
    expect(shouldEnableScrollScrub(deepLink)).toBe(shouldEnableScrollScrub(normal));
  });
});
