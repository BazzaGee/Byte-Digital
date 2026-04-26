const DOT_SIZE = 5;
const GAP = 7;
const COLORS = [
  { r: 139, g: 120, b: 230 },
  { r: 94, g: 234, b: 212 },
  { r: 61, g: 58, b: 82 },
];
const COLOR_WEIGHTS = [0.4, 0.4, 0.2];

function pickColor(): number {
  const r = Math.random();
  if (r < COLOR_WEIGHTS[0]) return 0;
  if (r < COLOR_WEIGHTS[0] + COLOR_WEIGHTS[1]) return 1;
  return 2;
}

export function initDotMatrixCanvas(id: string): void {
  const wrapper = document.getElementById(id);
  if (!wrapper) return;
  const section = wrapper.parentElement;
  if (!section) return;
  const canvas = document.createElement('canvas');
  wrapper.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let w: number, h: number, cols: number, rows: number;
  let dots: Array<{ colorIdx: number; speed: number; offset: number }>;

  function build(): void {
    const rect = section.getBoundingClientRect();
    w = rect.width;
    h = rect.height;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    cols = Math.ceil(w / (DOT_SIZE + GAP)) + 1;
    rows = Math.ceil(h / (DOT_SIZE + GAP)) + 1;
    dots = [];
    for (let i = 0; i < cols * rows; i++) {
      dots.push({
        colorIdx: pickColor(),
        speed: 1.5 + Math.random() * 2.5,
        offset: Math.random() * Math.PI * 2,
      });
    }
  }

  build();

  function draw(time: number): void {
    ctx.clearRect(0, 0, w, h);
    const step = DOT_SIZE + GAP;
    const t = time / 1000;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const idx = row * cols + col;
        const d = dots[idx];
        if (!d) continue;
        const c = COLORS[d.colorIdx];
        const pulse = (Math.sin(t * d.speed + d.offset) + 1) / 2;
        const alpha = 0.12 + pulse * 0.55;
        const size = DOT_SIZE * (0.7 + pulse * 0.3);

        ctx.beginPath();
        ctx.arc(
          col * step + step / 2,
          row * step + step / 2,
          Math.max(0.5, size / 2),
          0,
          Math.PI * 2
        );
        ctx.fillStyle = `rgba(${c.r},${c.g},${c.b},${alpha.toFixed(2)})`;
        ctx.fill();

        if (d.colorIdx < 2 && pulse > 0.5) {
          ctx.beginPath();
          ctx.arc(
            col * step + step / 2,
            row * step + step / 2,
            Math.max(0.5, size / 2 + 2),
            0,
            Math.PI * 2
          );
          ctx.fillStyle = `rgba(${c.r},${c.g},${c.b},${(alpha * 0.25).toFixed(2)})`;
          ctx.fill();
        }
      }
    }

    requestAnimationFrame(draw);
  }

  requestAnimationFrame(draw);
  window.addEventListener('resize', build);
}
