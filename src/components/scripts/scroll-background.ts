/**
 * Scroll-scrubbed background engine.
 *
 * The orbs video is a 9s loop sampled into sprite sheets (6x6 grid). The whole
 * site is treated as one continuous timeline: total document scroll maps 1:1
 * onto the frame sequence, so scrolling down advances the animation, scrolling
 * up rewinds it, and stopping stops it dead. This is positional, not time-based
 * -- the same scroll offset always shows the same frame on every page.
 *
 * Sprite sheets rather than individual frames: 6 requests instead of 216, which
 * keeps HTTP/1.1 head-of-line blocking from stalling the sequence on a long page.
 * Sheets are decoded lazily and released behind the playhead to bound memory.
 */

const SHEET_COLS = 6;
const SHEET_ROWS = 6;
const FRAMES_PER_SHEET = SHEET_COLS * SHEET_ROWS;

const HD = { dir: '/orbs/hd', tileW: 512, tileH: 288, sheets: 6 };
const LD = { dir: '/orbs/ld', tileW: 384, tileH: 216, sheets: 3 };

/** How many decoded sheets to keep resident around the playhead. */
const CACHE_RADIUS = 2;

/**
 * Per-frame lerp. 1 = frame-locked to the scroll position (stuttery on
 * low-refresh trackpads), 0 = never catches up. 0.22 lands close enough to
 * the scrollbar to read as the video being physically dragged, while damping
 * the jitter that raw pixel deltas produce.
 */
const SMOOTHING = 0.22;

/** Below this many pixels of remaining gap, snap -- avoids an asymptotic crawl. */
const SNAP_EPSILON = 0.004;

interface Profile {
  dir: string;
  tileW: number;
  tileH: number;
  sheets: number;
  total: number;
}

export function initScrollBackground(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;
  // Captured as a non-null const: TypeScript drops the narrowing from the
  // guard above once the reference is used inside a nested closure.
  const g: CanvasRenderingContext2D = ctx;

  const coarse =
    window.matchMedia('(pointer: coarse)').matches ||
    window.matchMedia('(max-width: 768px)').matches;
  const profile: Profile = coarse ? { ...LD, total: LD.sheets * FRAMES_PER_SHEET } : { ...HD, total: HD.sheets * FRAMES_PER_SHEET };

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  // ---------------------------------------------------------------- sizing
  // Cap the backing store so huge/retina viewports don't pay for a 4K canvas
  // on every scroll tick. The layer is 25% opacity behind opaque panels, so
  // beyond ~1.5x device pixels there is nothing left to resolve.
  const DPR_CAP = 1.5;
  let dpr = 1;
  let vw = 0;
  let vh = 0;

  function resize(): void {
    dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
    vw = window.innerWidth;
    vh = window.innerHeight;
    canvas.width = Math.round(vw * dpr);
    canvas.height = Math.round(vh * dpr);
    canvas.style.width = vw + 'px';
    canvas.style.height = vh + 'px';
    dirty = true;
  }

  // ---------------------------------------------------------- sheet loading
  const bitmaps = new Map<number, ImageBitmap>();
  const inflight = new Map<number, Promise<void>>();

  function sheetUrl(index: number): string {
    return `${profile.dir}/sheet_${String(index + 1).padStart(2, '0')}.webp`;
  }

  function loadSheet(index: number): Promise<void> {
    const existing = inflight.get(index);
    if (existing) return existing;

    const p = (async () => {
      const res = await fetch(sheetUrl(index), { credentials: 'omit' });
      if (!res.ok) throw new Error(`sheet ${index}: HTTP ${res.status}`);
      const blob = await res.blob();
      const bmp = await createImageBitmap(blob);
      bitmaps.set(index, bmp);
      // Decoding is async, so by the time a sheet lands the rAF loop has
      // usually already parked itself at its snap threshold. Without this the
      // sheet would sit decoded and undrawn until the user happened to scroll.
      paint();
    })();

    p.finally(() => inflight.delete(index));
    p.catch(() => {
      /* Transient failure (offline, 5xx). Swallowed deliberately: the poster
         still covers the viewport, and a later scroll retries via ensureSheets. */
    });

    inflight.set(index, p);
    return p;
  }

  /**
   * Which sheet holds a given frame index. `progress` is the eased 0..1
   * timeline position; it has to be converted back to a frame index before
   * deriving the sheet, or every frame maps to sheet 0 and the rest of the
   * sequence never loads.
   */
  function currentSheet(): number {
    const frame = Math.max(
      0,
      Math.min(profile.total - 1, Math.floor(current * profile.total))
    );
    return Math.floor(frame / FRAMES_PER_SHEET);
  }

  function evictDistantSheets(): void {
    const keep = currentSheet();
    for (const key of bitmaps.keys()) {
      if (Math.abs(key - keep) > CACHE_RADIUS) {
        bitmaps.get(key)!.close();
        bitmaps.delete(key);
      }
    }
  }

  function ensureSheets(): void {
    const keep = currentSheet();
    for (let i = keep - CACHE_RADIUS; i <= keep + CACHE_RADIUS; i++) {
      if (i >= 0 && i < profile.sheets && !bitmaps.has(i) && !inflight.has(i)) {
        void loadSheet(i);
      }
    }
    evictDistantSheets();
  }

  // --------------------------------------------------------------- drawing
  let dirty = true;

  /**
   * Cover-fit the 16:9 source into the viewport. Anchored on the tile box so
   * adjacent frames stay registered to each other -- a scale computed per-frame
   * from the tile would drift as rounding kicked in.
   */
  function draw(): void {
    // `current` is a normalised 0..1 timeline position, not a frame index.
    const frame = Math.max(
      0,
      Math.min(profile.total - 1, Math.floor(current * profile.total))
    );
    const sheetIndex = Math.floor(frame / FRAMES_PER_SHEET);
    const bmp = bitmaps.get(sheetIndex);

    if (!bmp) {
      // Nothing decoded yet: the poster underneath already covers the
      // viewport, so just keep the load queued for the next tick.
      ensureSheets();
      return;
    }

    const cell = frame % FRAMES_PER_SHEET;
    const col = cell % SHEET_COLS;
    const row = Math.floor(cell / SHEET_COLS);

    const sx = col * profile.tileW;
    const sy = row * profile.tileH;

    const scale = Math.max(
      canvas.width / profile.tileW,
      canvas.height / profile.tileH
    );
    const dw = profile.tileW * scale;
    const dh = profile.tileH * scale;
    const dx = (canvas.width - dw) / 2;
    const dy = (canvas.height - dh) / 2;

    g.clearRect(0, 0, canvas.width, canvas.height);
    g.drawImage(bmp, sx, sy, profile.tileW, profile.tileH, dx, dy, dw, dh);
  }

  /** Redraw now, and wake the loop so it can keep easing toward the target. */
  function paint(): void {
    draw();
    start();
  }

  // ---------------------------------------------------------------- scroll
  let target = 0;
  let current = 0;
  let rafId = 0;
  let running = false;

  function maxScroll(): number {
    return Math.max(
      1,
      document.documentElement.scrollHeight - window.innerHeight
    );
  }

  function readScroll(): void {
    const y = window.scrollY || window.pageYOffset || 0;
    target = Math.max(0, Math.min(1, y / maxScroll()));
    start();
  }

  function tick(): void {
    const gap = target - current;
    if (Math.abs(gap) < SNAP_EPSILON) {
      // Land exactly on target. Without this the loop can park just shy of it
      // and the playhead sits up to SNAP_EPSILON * totalFrames (~0.9 frame)
      // off, so returning to the same scroll offset wouldn't reproduce the
      // same frame.
      if (current !== target) {
        current = target;
        dirty = true;
      }
    } else {
      // Frame-rate independent damping. The 0.22 lerp is authored for 60Hz;
      // the time term keeps the feel identical on 120Hz displays.
      const dt = 1 / 60;
      const alpha = 1 - Math.pow(1 - SMOOTHING, dt * 60);
      current += gap * alpha;
      dirty = true;
    }

    if (dirty) {
      ensureSheets();
      draw();
      dirty = false;
    }

    // `current` was snapped above if it was within epsilon, so this is an
    // exact comparison now -- the loop parks only when it has truly arrived.
    if (current === target) {
      running = false;
      rafId = 0;
      return;
    }
    rafId = requestAnimationFrame(tick);
  }

  function start(): void {
    if (running) return;
    running = true;
    rafId = requestAnimationFrame(tick);
  }

  function renderStatic(): void {
    current = target = 0;
    bitmaps.forEach((b) => b.close());
    bitmaps.clear();
    inflight.clear();
    // Deliberately does not call draw(). The poster element is already
    // painting the same first frame at the same opacity, so drawing here
    // would achieve nothing except kick off a sheet fetch -- ~450KB the
    // visitor asked us not to spend by enabling reduced motion.
  }

  // ----------------------------------------------------------------- wiring
  resize();

  if (reduced.matches) {
    // Honour the OS setting: static poster, no scrubbing, no fetching.
    renderStatic();
    return;
  }

  // Prime the first sheets immediately so frame 0 is ready before the user
  // scrolls. Sequential rather than parallel -- they all land in the same
  // HTTP/1.1 connection, so serialising keeps decode off the critical path.
  current = 0;
  ensureSheets();
  draw();

  readScroll();
  current = target;

  window.addEventListener('scroll', readScroll, { passive: true });

  let resizeTimer = 0;
  window.addEventListener(
    'resize',
    () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        resize();
        readScroll();
        ensureSheets();
        draw();
      }, 150);
    },
    { passive: true }
  );

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = 0;
      running = false;
    } else {
      dirty = true;
      readScroll();
    }
  });

  // Drop the hero's legibility wash once the hero has scrolled away. It's only
  // needed while unpanneled text is on screen; keeping it on would darken the
  // gutters between panels for the entire rest of the site.
  //
  // Both hero variants are observed: the homepage uses `.hero`, while
  // PageHero.astro renders `.page-hero`. Both put body text directly on the
  // video, and both need the wash -- matching only one left ~20 inner pages
  // permanently darkened with the wash doing nothing for their legibility.
  const bg = document.querySelector('.orb-bg');
  const hero = document.querySelector('.hero, .page-hero');
  if (bg && hero && 'IntersectionObserver' in window) {
    // PageHero's copy is centred, the homepage hero's is left-weighted, so
    // the wash shape is chosen per page rather than applied uniformly.
    bg.classList.toggle('aa-centered', hero.classList.contains('page-hero'));
    const heroObs = new IntersectionObserver(
      ([entry]) => bg.classList.toggle('aa-off', !entry.isIntersecting),
      { threshold: 0 }
    );
    heroObs.observe(hero);
  }

  // Content loading (images, calculator JS) changes document height after
  // mount, which would otherwise leave the timeline mapped to a stale length.
  if ('ResizeObserver' in window) {
    let lastH = document.documentElement.scrollHeight;
    const ro = new ResizeObserver(() => {
      const h = document.documentElement.scrollHeight;
      if (h === lastH) return;
      lastH = h;
      readScroll();
    });
    ro.observe(document.body);
  }
}
