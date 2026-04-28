const TOTAL = 145;
const DIR = '/frames/';

interface AnimStyle {
  enter: { y?: number; x?: number; scale: number };
  exit: { y?: number; x?: number; scale: number };
}

export function initScrollVideo(): void {
  const canvas = document.getElementById('frame-canvas') as HTMLCanvasElement | null;
  if (!canvas) return;
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) return;

  const section = document.getElementById('scroll-video');
  const progressFill = document.getElementById('progress-fill');
  const frameCounter = document.getElementById('frame-counter');
  const scrollHint = document.getElementById('scroll-hint');
  const scrollIndicator = document.getElementById('scroll-indicator');
  const darkOverlay = document.getElementById('dark-overlay');

  canvas.width = 1920;
  canvas.height = 1080;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'medium';

  const images: HTMLImageElement[] = [];
  let loaded = 0;
  let curFrame = -1;

  function loadAll(): Promise<void> {
    return new Promise((resolve) => {
      for (let i = 0; i < TOTAL; i++) {
        const img = new Image();
        img.src = DIR + 'frame_' + String(i).padStart(4, '0') + '.jpg';
        img.onload = img.onerror = () => {
          loaded++;
          if (loaded === TOTAL) resolve();
        };
        images[i] = img;
      }
    });
  }

  function draw(idx: number): void {
    if (idx === curFrame || idx < 0 || idx >= TOTAL) return;
    if (!images[idx] || !images[idx].complete) return;
    curFrame = idx;
    ctx.drawImage(images[idx], 0, 0, 1920, 1080);
  }

  const cards: HTMLElement[] = [];
  for (let c = 0; c < 7; c++) {
    const card = document.getElementById('card-' + c);
    if (card) cards.push(card);
  }

  const segments = [
    { start: 0.00, end: 0.13 },
    { start: 0.13, end: 0.27 },
    { start: 0.27, end: 0.40 },
    { start: 0.40, end: 0.53 },
    { start: 0.53, end: 0.67 },
    { start: 0.67, end: 0.82 },
    { start: 0.82, end: 1.00 },
  ];

  const animStyles: AnimStyle[] = [
    { enter: { y: 50, scale: 0.92 }, exit: { y: -30, scale: 1.01 } },
    { enter: { y: 40, scale: 0.88 }, exit: { y: -40, scale: 1.03 } },
    { enter: { x: -50, scale: 0.94 }, exit: { x: 40, scale: 1.01 } },
    { enter: { scale: 0.82 }, exit: { scale: 1.08 } },
    { enter: { x: 50, scale: 0.94 }, exit: { x: -40, scale: 1.01 } },
    { enter: { y: 40, scale: 0.88 }, exit: { y: -40, scale: 1.03 } },
    { enter: { scale: 0.85, y: 20 }, exit: { scale: 1.02 } },
  ];

  function easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }
  function easeInCubic(t: number): number {
    return t * t * t;
  }

  let cachedVh = window.innerHeight;
  let cachedOffsetHeight = section ? section.offsetHeight : 0;
  let cachedSectionTop = section ? section.offsetTop : 0;

  function recalcLayout(): void {
    cachedVh = window.innerHeight;
    if (section) {
      cachedOffsetHeight = section.offsetHeight;
      cachedSectionTop = section.offsetTop;
    }
  }

  window.addEventListener('resize', () => {
    recalcLayout();
  }, { passive: true });

  const prevOpacity = new Float32Array(cards.length).fill(-1);

  function updateCards(progress: number): void {
    let anyVisible = false;

    for (let i = 0; i < cards.length; i++) {
      const seg = segments[i];
      const anim = animStyles[i];
      const el = cards[i];
      if (!el || !seg || !anim) continue;

      let opacity = 0;
      let tx = 0, ty = 0, s = 1;

      if (progress >= seg.start && progress <= seg.end) {
        anyVisible = true;
        const range = seg.end - seg.start;
        const local = (progress - seg.start) / range;
        const midStart = 0.3, midEnd = 0.7;

        if (local < midStart) {
          const t = easeOutCubic(local / midStart);
          opacity = t;
          ty = (anim.enter.y || 0) * (1 - t);
          tx = (anim.enter.x || 0) * (1 - t);
          s = anim.enter.scale + (1 - anim.enter.scale) * t;
        } else if (local <= midEnd) {
          opacity = 1;
        } else {
          const t2 = easeInCubic((local - midEnd) / (1 - midEnd));
          opacity = 1 - t2;
          ty = (anim.exit.y || 0) * t2;
          tx = (anim.exit.x || 0) * t2;
          s = 1 + ((anim.exit.scale || 1) - 1) * t2;
        }
      }

      opacity = Math.max(0, Math.min(1, opacity));

      if (opacity === 0 && prevOpacity[i] === 0) continue;

      prevOpacity[i] = opacity;

      if (opacity === 0) {
        el.style.opacity = '0';
        el.style.transform = 'translate3d(0,0,0) scale(1)';
        continue;
      }

      el.style.opacity = opacity.toFixed(3);
      el.style.transform = `translate3d(${tx.toFixed(1)}px,${ty.toFixed(1)}px,0) scale(${s.toFixed(3)})`;
    }

    if (darkOverlay) {
      darkOverlay.style.opacity = anyVisible ? '1' : '0';
    }
  }

  function onScroll(): void {
    if (!section) return;

    const scrollY = window.scrollY;
    const top = cachedSectionTop - scrollY;
    const scrollable = cachedOffsetHeight - cachedVh;

    if (top > 0) {
      draw(0);
      if (progressFill) progressFill.style.width = '0%';
      updateCards(0);
      if (frameCounter) frameCounter.textContent = '000 / 144';
      if (scrollHint) scrollHint.style.opacity = '';
      if (scrollIndicator) scrollIndicator.style.opacity = '';
      return;
    }

    const p = Math.min(1, Math.max(0, -top / scrollable));
    const fi = Math.min(TOTAL - 1, Math.floor(p * (TOTAL - 1)));

    draw(fi);
    if (progressFill) progressFill.style.width = (p * 100).toFixed(1) + '%';
    if (frameCounter) frameCounter.textContent = String(fi).padStart(3, '0') + ' / 144';
    updateCards(p);

    if (p > 0.01) {
      if (scrollHint) scrollHint.style.opacity = '0';
      if (scrollIndicator) scrollIndicator.style.opacity = '0';
    } else {
      if (scrollHint) scrollHint.style.opacity = '';
      if (scrollIndicator) scrollIndicator.style.opacity = '';
    }
  }

  let ticking = false;
  window.addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          onScroll();
          ticking = false;
        });
        ticking = true;
      }
    },
    { passive: true }
  );

  loadAll().then(() => {
    recalcLayout();
    draw(0);
    onScroll();
  });
}
