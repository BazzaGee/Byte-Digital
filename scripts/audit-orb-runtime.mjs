/**
 * Runtime audit: render every built page and confirm the scroll-scrubbed
 * background is actually alive, not just present in the HTML.
 *
 * Presence in the markup is not proof. This drives a real browser over every
 * route and checks, per page:
 *   1. the canvas exists and has non-zero size
 *   2. the engine painted pixels into it (not a blank layer)
 *   3. scrolling to a different offset produces a different frame
 *   4. scrolling back reproduces the original frame (reversible)
 *   5. no page errors were thrown
 *
 * Usage: node scripts/audit-orb-runtime.mjs [baseUrl] [maxPages]
 *
 * Playwright is not a project dependency (the global playwright-cli owns the
 * browser install), so the import is resolved from the global npm root.
 * ESM ignores NODE_PATH, hence the explicit path probing below.
 */
import { execSync } from 'child_process';
import { createRequire } from 'module';

function loadPlaywright() {
  const require = createRequire(import.meta.url);
  try {
    return require('playwright');
  } catch {
    /* fall through to the global npm root */
  }
  const root = execSync('npm root -g', { encoding: 'utf8' }).trim();
  return createRequire(`${root}/`).call(null, 'playwright');
}

const { chromium } = loadPlaywright();
import { readdirSync, statSync } from 'fs';
import { join, relative, sep } from 'path';

const BASE = process.argv[2] || 'http://127.0.0.1:4330';
const MAX_PAGES = Number(process.argv[3] || 0); // 0 = all
const DIST = 'dist';

const EXEMPT = ['/admin-login/', '/chatbot-dashboard/'];

/** Collect every built route as a URL path. */
function collectRoutes(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      collectRoutes(full, out);
    } else if (entry === 'index.html' || entry === '404.html') {
      let rel = relative(DIST, full)
        .replace('index.html', '')
        .replace('404.html', '')
        .split(sep)
        .join('/');
      rel = '/' + rel.replace(/^\/+/, '');
      if (!rel.endsWith('/')) rel += '/';
      out.push(rel);
    }
  }
  return out;
}

const routes = [...new Set(collectRoutes(DIST))].filter(
  (r) => !EXEMPT.some((e) => r.startsWith(e))
);
const targets = MAX_PAGES > 0 ? routes.slice(0, MAX_PAGES) : routes;

console.log(`Auditing ${targets.length} routes against ${BASE}\n`);

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });

const failures = [];
let checked = 0;

for (const route of targets) {
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));

  const result = await (async () => {
    await page.goto(BASE + route, { waitUntil: 'load', timeout: 45000 });

    // Respect reduced-motion isn't needed here: we want the full engine.
    await page.waitForFunction(
      () => document.documentElement.classList.contains('js'),
      { timeout: 15000 }
    );

    // Let the first sprite sheets decode and paint.
    await page.waitForTimeout(1800);

    const probe = async (fraction) =>
      page.evaluate(async (f) => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        window.scrollTo(0, Math.round(max * f));
        // Two frames of settle, then let the eased playhead converge.
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
        await new Promise((r) => setTimeout(r, 1800));

        const c = document.getElementById('orb-bg-canvas');
        if (!c) return { err: 'no canvas' };
        const ctx = c.getContext('2d', { willReadFrequently: true });
        const d = ctx.getImageData(0, 0, c.width, c.height).data;

        let painted = 0;
        let sum = 0;
        for (let i = 0; i < d.length; i += 400) {
          if (d[i + 3] > 0) painted++;
          sum += d[i] + d[i + 1] + d[i + 2];
        }
        return {
          w: c.width,
          h: c.height,
          painted,
          sig: Math.round(sum / 1000),
        };
      }, fraction);

    const top = await probe(0);
    const mid = await probe(0.5);
    const back = await probe(0);

    return { top, mid, back };
  })().catch((e) => ({ fatal: String(e).slice(0, 160) }));

  await page.close();
  checked++;

  const problems = [];
  if (result.fatal) {
    problems.push(`fatal: ${result.fatal}`);
  } else {
    if (result.top.err) problems.push(result.top.err);
    if (!(result.top.w > 0 && result.top.h > 0)) {
      problems.push(`zero-size canvas ${result.top.w}x${result.top.h}`);
    }
    if (result.top.painted === 0) problems.push('canvas never painted');
    if (result.mid.sig === result.top.sig) problems.push('scroll did not change frame');
    // Reversible: allow tiny interpolation drift, flag a genuinely wrong frame.
    if (Math.abs(result.back.sig - result.top.sig) > 8) {
      problems.push(`not reversible (${result.top.sig} -> ${result.back.sig})`);
    }
  }
  if (errors.length) problems.push(`pageerror: ${errors[0].slice(0, 100)}`);

  if (problems.length) {
    failures.push({ route, problems });
    console.log(`FAIL  ${route}\n        ${problems.join('\n        ')}`);
  } else {
    console.log(`ok    ${route}  (sig ${result.top.sig} -> ${result.mid.sig} -> ${result.back.sig})`);
  }
}

await browser.close();

console.log(`\nchecked ${checked} routes, ${failures.length} failing`);
if (failures.length) {
  console.log('\nFailing routes:');
  for (const f of failures) console.log('  ' + f.route);
  process.exit(1);
}
console.log('All pages have a working scroll-scrubbed background.');
