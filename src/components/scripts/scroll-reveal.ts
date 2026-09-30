/**
 * Reveal on scroll.
 *
 * Two things are revealed:
 *  - `.reveal` — the pre-existing generic fade-up, kept for elements that
 *    aren't panels (cards, list items, anything opted in individually).
 *  - `.section > .container` / `.svc-row > .container` — the panels. These get
 *    `.panel-in`, which the CSS turns into the pop-up. They are selected
 *    structurally so no component needs to opt in, which is what lets this
 *    apply to every page on the site rather than just the homepage.
 *
 * `once` keeps the observer: panels are tall, so one that is taller than the
 * viewport re-intersects constantly and would otherwise re-trigger the
 * entrance on every scroll tick.
 */

const PANEL_SELECTOR = '.section > .container, .svc-row > .container';

export function initScrollReveal(): void {
  if (!('IntersectionObserver' in window)) {
    document
      .querySelectorAll(`${PANEL_SELECTOR}, .reveal`)
      .forEach((el) => el.classList.add('visible', 'panel-in'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('visible', 'panel-in');
        observer.unobserve(entry.target);
      }
    },
    {
      // Fire slightly before the panel reaches the fold so it has finished
      // arriving by the time it's actually being read.
      threshold: 0.08,
      rootMargin: '0px 0px -8% 0px',
    }
  );

  document
    .querySelectorAll(`${PANEL_SELECTOR}, .reveal`)
    .forEach((el) => observer.observe(el));

  // A reload restores the previous scroll offset, and an in-page anchor jumps
  // straight to its target. In both cases the observer never sees the panels
  // that were skipped over, which would leave them stuck at opacity 0.
  requestAnimationFrame(() => {
    document
      .querySelectorAll(`${PANEL_SELECTOR}, .reveal`)
      .forEach((el) => {
        if (el.getBoundingClientRect().top < window.innerHeight) {
          el.classList.add('visible', 'panel-in');
          observer.unobserve(el);
        }
      });
  });
}
