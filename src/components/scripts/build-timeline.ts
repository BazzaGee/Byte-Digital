// The stage timeline shown after a rebuild brief is submitted.
//
// The pipeline genuinely takes a couple of hours, and it exposes no public
// status endpoint, so this timeline is illustrative rather than live: stages
// and the bar advance from the wall clock, seeded at submit time and stored in
// localStorage so a reload picks up where it left off. Everything is derived
// from Date.now() - startedAt, never from accumulated ticks, so a suspended
// mobile tab catches up correctly when it wakes.

export type StageIcon =
  | 'clipboard'
  | 'search'
  | 'pen'
  | 'image'
  | 'palette'
  | 'code'
  | 'sparkles'
  | 'gauge'
  | 'phone'
  | 'eye'
  | 'box';

export interface BuildStage {
  id: string;
  icon: StageIcon;
  title: string;
  detail: string;
  aside: string;
  // Relative share of the total runtime. They sum to 100 so they read as
  // rough percentages of the wait.
  weight: number;
  // Monospace lines that stream past while this stage is active. Decorative.
  logs: string[];
}

export const BUILD_TOTAL_MS = 3 * 60 * 60_000;

// How long the full animation holds before collapsing into the small card.
export const BUILD_COMPACT_AFTER_MS = 30_000;

// The bar deliberately never fills on its own. The site is finished when the
// email arrives, not when a client-side animation decides it is.
export const BUILD_MAX_PCT = 97;

export const STAGE_ICONS: Record<StageIcon, string> = {
  clipboard:
    '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  pen: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  image:
    '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/>',
  palette:
    '<circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.9 0 1.6-.7 1.6-1.6 0-.4-.1-.8-.4-1.1-.3-.3-.4-.6-.4-1.1a1.6 1.6 0 0 1 1.6-1.6h2c3 0 5.6-2.5 5.6-5.6C22 6 17.5 2 12 2Z"/>',
  code: '<path d="m16 18 6-6-6-6"/><path d="m8 6-6 6 6 6"/>',
  sparkles:
    '<path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/>',
  gauge: '<path d="m12 14 4-4"/><path d="M3.3 19a10 10 0 1 1 17.4 0"/>',
  phone: '<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/>',
  eye: '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
  box: '<path d="M21 8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>',
};

export const BUILD_STAGES: BuildStage[] = [
  {
    id: 'brief',
    icon: 'clipboard',
    title: 'Reading your brief',
    detail: 'Going back over everything you told me.',
    aside: 'The fun bit starts now.',
    weight: 1.5,
    logs: ['reading /rebuild brief', '6 answers, 1 story', 'noting: values up front', 'setting the tone'],
  },
  {
    id: 'scout',
    icon: 'search',
    title: 'Snooping around',
    detail: 'Seeing what else is out there, and what makes you different.',
    aside: 'No judgement — promise.',
    weight: 6.5,
    logs: [
      'checking competitors',
      'reading google reviews',
      'finding the angle',
      'what customers actually say',
      'noting what to avoid',
    ],
  },
  {
    id: 'words',
    icon: 'pen',
    title: 'Finding the right words',
    detail: 'Turning your answers into pages that sound like you.',
    aside: 'If a sentence does not sound like you, it gets cut.',
    weight: 13,
    logs: [
      'drafting home',
      'writing /services',
      'cutting filler',
      'reading it aloud',
      'tightening headlines',
      'checking facts',
    ],
  },
  {
    id: 'photos',
    icon: 'image',
    title: 'Hunting for photos',
    detail: 'Real pictures of real work — no grey boxes.',
    aside: 'This is where a lot of the time goes.',
    weight: 11,
    logs: [
      'sourcing images',
      'rejecting stock photos',
      'resizing for web',
      'writing alt text',
      'compressing 240kb -> 48kb',
    ],
  },
  {
    id: 'design',
    icon: 'palette',
    title: 'Picking the colours',
    detail: 'Something that looks like your business, not a template.',
    aside: 'Purple and teal is my thing. You get to have yours.',
    weight: 10,
    logs: [
      'choosing palette',
      'setting type scale',
      'matching your brand',
      'spacing everything out',
      'picking one accent',
    ],
  },
  {
    id: 'build',
    icon: 'code',
    title: 'Building the pages',
    detail: 'This is the actual slow part. It is meant to be.',
    aside: 'Genuinely — this is normal.',
    weight: 22,
    logs: [
      'writing markup',
      'compiling pages',
      'wiring the nav',
      'mobile pass',
      'fixing the footer',
      'gate: local ok',
      'checking every link',
    ],
  },
  {
    id: 'polish',
    icon: 'sparkles',
    title: 'Fiddling with the little bits',
    detail: 'The details nobody notices unless they are wrong.',
    aside: 'It is the boring bits that make it feel expensive.',
    weight: 12,
    logs: [
      'alignment: 1px off',
      'fixing hover states',
      'tuning transitions',
      'spacing the buttons',
      'checking contrast',
    ],
  },
  {
    id: 'speed',
    icon: 'gauge',
    title: 'Making sure it is quick',
    detail: 'Nobody should be waiting on a photo to load.',
    aside: 'Fast sites get more calls.',
    weight: 6,
    logs: ['measuring load time', 'lazy-loading images', 'trimming css', 'cache headers set'],
  },
  {
    id: 'phones',
    icon: 'phone',
    title: 'Checking it on a phone',
    detail: 'Most of your customers will see it on one.',
    aside: 'If it does not work on a phone, it does not work.',
    weight: 7,
    logs: ['360px: ok', '390px: ok', 'tablet: ok', 'thumb-reach pass', 'menu tap test'],
  },
  {
    id: 'review',
    icon: 'eye',
    title: 'Reading it back like a customer',
    detail: 'Would I pick this business? That is the test.',
    aside: 'Last pair of eyes before it goes to you.',
    weight: 9,
    logs: [
      'reading as a first-timer',
      'does it answer: price?',
      'does it answer: area?',
      'does it answer: contact?',
      'last read-through',
    ],
  },
  {
    id: 'handover',
    icon: 'box',
    title: 'Wrapping it up',
    detail: 'Nearly there — check your inbox soon.',
    aside: 'The next email you get from me is the good one.',
    weight: 2,
    logs: ['packing files', 'queuing your email', 'see you in your inbox'],
  },
];

export interface BuildProgress {
  // Bar percentage, 0..BUILD_MAX_PCT. Never reaches 100.
  pct: number;
  stageIndex: number;
  // 0..1 within the current stage.
  stageProgress: number;
}

const TOTAL_WEIGHT = BUILD_STAGES.reduce((sum, stage) => sum + stage.weight, 0);

// Cumulative weight at the start of each stage, normalised to 0..1.
const STAGE_STARTS: number[] = (() => {
  const starts: number[] = [];
  let running = 0;
  for (const stage of BUILD_STAGES) {
    starts.push(running / TOTAL_WEIGHT);
    running += stage.weight;
  }
  return starts;
})();

// The first minute is compressed so the bar visibly moves before the visitor
// gets bored and leaves. Warm-up reaches 1.5% by ~90s, at which point the
// natural curve has caught up and takes over.
const WARMUP_MS = 90_000;
const WARMUP_PCT = 1.5;

function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function progressAt(elapsedMs: number): BuildProgress {
  const t = Math.min(Math.max(elapsedMs / BUILD_TOTAL_MS, 0), 1);

  let stageIndex = BUILD_STAGES.length - 1;
  for (let i = 0; i < STAGE_STARTS.length; i += 1) {
    if (t < STAGE_STARTS[i]) {
      stageIndex = i - 1;
      break;
    }
    stageIndex = i;
  }
  stageIndex = Math.max(0, Math.min(stageIndex, BUILD_STAGES.length - 1));

  const start = STAGE_STARTS[stageIndex];
  const end =
    stageIndex + 1 < STAGE_STARTS.length ? STAGE_STARTS[stageIndex + 1] : 1;
  const span = Math.max(end - start, 1e-9);
  const stageProgress = Math.min(Math.max((t - start) / span, 0), 1);

  // Global deceleration: fast early, slower later, asymptote below 100%.
  const natural = BUILD_MAX_PCT * (1 - Math.pow(1 - t, 2.2));
  const warmup = WARMUP_PCT * Math.min(elapsedMs / WARMUP_MS, 1);
  const pct = Math.min(Math.max(natural, warmup), BUILD_MAX_PCT);

  return { pct, stageIndex, stageProgress };
}

export function remainingMs(elapsedMs: number): number {
  return Math.max(BUILD_TOTAL_MS - elapsedMs, 0);
}

export function formatDuration(ms: number): string {
  const totalMinutes = Math.max(0, Math.round(ms / 60_000));
  if (totalMinutes < 1) return 'under a minute';
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (!hours) return `${minutes} min`;
  if (!minutes) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}
