/**
 * heroMotion.ts — pure decision logic for how the scroll-expansion hero
 * should behave for a given visitor. No DOM, no React: safe to unit test
 * directly, following the same pure-logic/thin-glue split as the rest of
 * lib/habitat.
 *
 * Mirrors the `shouldShowIntroSection` / `shouldLockScroll` predicates from
 * the earlier vanilla-JS build of this project, for the same reason: the
 * conditions under which an animation is skipped are accessibility
 * behavior, not incidental styling, and they deserve tests rather than
 * living inline in an effect.
 */

export interface HeroMotionContext {
  /** The visitor has `prefers-reduced-motion: reduce` set. */
  prefersReducedMotion: boolean;
  /** The URL carries a ?lat=&lon= deep link (a shared/bookmarked result). */
  hasDeepLink: boolean;
}

/**
 * Whether the hero should mount already fully expanded, with its content
 * visible immediately.
 *
 * - Reduced motion: yes — the expand animation is the thing being opted out
 *   of, so show its finished state rather than a half-open one.
 * - Deep link: yes — someone followed a link to a specific result; making
 *   them scrub an animation before seeing the data they asked for hides it
 *   behind motion for no reason.
 */
export function shouldStartExpanded({ prefersReducedMotion, hasDeepLink }: HeroMotionContext): boolean {
  return prefersReducedMotion || hasDeepLink;
}

/**
 * Whether to attach the scroll-scrub input handlers at all.
 *
 * This is deliberately NOT the same question as `shouldStartExpanded`, and
 * conflating the two is the bug this function exists to prevent. The hero's
 * wheel handler re-collapses the hero when a fully-expanded visitor scrolls
 * up near the top of the page, and its scroll handler pins the window to
 * scrollY 0 while the hero is collapsed. So a reduced-motion visitor who
 * merely *started* expanded would still get yanked back into a scroll-
 * jacked animation the moment they scrolled up — the exact experience they
 * opted out of.
 *
 * A deep-link visitor, by contrast, has not expressed any preference about
 * motion: they should keep the normal interactive hero, just pre-opened.
 */
export function shouldEnableScrollScrub({ prefersReducedMotion }: HeroMotionContext): boolean {
  return !prefersReducedMotion;
}
