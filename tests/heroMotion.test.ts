import { describe, test, expect } from "vitest";
import { shouldStartExpanded, shouldEnableScrollScrub } from "@/lib/habitat/heroMotion";

describe("shouldStartExpanded", () => {
  test("a normal first-time visitor gets the collapsed, scrubable hero", () => {
    expect(shouldStartExpanded({ prefersReducedMotion: false, hasDeepLink: false })).toBe(false);
  });

  test("reduced motion starts expanded (show the animation's end state, not a half-open one)", () => {
    expect(shouldStartExpanded({ prefersReducedMotion: true, hasDeepLink: false })).toBe(true);
  });

  test("a deep link starts expanded so the linked result is visible immediately", () => {
    expect(shouldStartExpanded({ prefersReducedMotion: false, hasDeepLink: true })).toBe(true);
  });

  test("both at once still starts expanded", () => {
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

  test("a deep link starts expanded but KEEPS the scrub — it implies no motion preference", () => {
    const ctx = { prefersReducedMotion: false, hasDeepLink: true };
    expect(shouldStartExpanded(ctx)).toBe(true);
    expect(shouldEnableScrollScrub(ctx)).toBe(true);
  });
});
