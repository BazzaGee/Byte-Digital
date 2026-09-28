#!/usr/bin/env node
/**
 * sync-websites.mjs — pull approved sites from the cf-opencode-website-builder
 * D1 registry into Byte Digital as MDX pages + homepage screenshots.
 *
 * Usage:
 *   node scripts/sync-websites.mjs [--builder-dir <path>] [--force] [--dry-run]
 *
 *   --builder-dir  path to cf-opencode-website-builder (default: C:/Users/barry/cf-opencode-website-builder)
 *   --force        re-download screenshots for sites that already have a page (existing MDX is never overwritten)
 *   --dry-run      list what would happen without writing or downloading anything
 *
 * Only sites with status = 'approved' are synced. Requires wrangler auth
 * (npx wrangler login) against the builder's Cloudflare account.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const DEFAULT_BUILDER_DIR = 'C:/Users/barry/cf-opencode-website-builder';
const BUCKET = 'opencode-website-builder-seeds';

function parseArgs(argv) {
  const out = { builderDir: DEFAULT_BUILDER_DIR, force: false, dryRun: false, help: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--force') out.force = true;
    else if (a === '--dry-run') out.dryRun = true;
    else if (a === '--help' || a === '-h') out.help = true;
    else if (a === '--builder-dir') out.builderDir = argv[++i] || out.builderDir;
    else if (a.startsWith('--builder-dir=')) out.builderDir = a.slice('--builder-dir='.length);
    else throw new Error(`unknown argument: ${a}`);
  }
  return out;
}

function slugify(name) {
  return String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'site';
}

function pagesProjectName(name) {
  const slug = slugify(name);
  return slug.length > 58 ? slug.slice(0, 58).replace(/-+$/g, '') : slug;
}

function runWrangler(args, { cwd, timeout = 600_000 }) {
  const localBin = path.join(cwd, 'node_modules', 'wrangler', 'bin', 'wrangler.js');
  if (!fs.existsSync(localBin)) {
    return { ok: false, stdout: '', stderr: `wrangler not installed in ${cwd} — run npm install there first` };
  }
  const res = spawnSync(process.execPath, [localBin, ...args], {
    cwd,
    encoding: 'utf8',
    timeout,
    maxBuffer: 64 * 1024 * 1024,
    windowsHide: true,
  });
  if (res.error) return { ok: false, stdout: '', stderr: String(res.error.message) };
  return { ok: res.status === 0, stdout: res.stdout || '', stderr: res.stderr || '' };
}

function fetchApprovedSites(builderDir) {
  const sql = "SELECT slug, dir_name, business_name, category, url, status, updated_at FROM sites WHERE status = 'approved' ORDER BY updated_at ASC";
  const res = runWrangler(['d1', 'execute', 'DB', '--remote', '--json', '--command', sql], { cwd: builderDir });
  if (!res.ok) throw new Error(`d1 query failed: ${(res.stderr || res.stdout).slice(-2000)}`);
  let parsed;
  try { parsed = JSON.parse(res.stdout); } catch { throw new Error(`could not parse d1 json: ${res.stdout.slice(0, 500)}`); }
  const batches = Array.isArray(parsed) ? parsed : [parsed];
  for (const batch of batches) {
    if (batch && Array.isArray(batch.results)) return batch.results;
  }
  throw new Error('d1 json contained no results array');
}

function r2Get(key, destFile, builderDir) {
  fs.mkdirSync(path.dirname(destFile), { recursive: true });
  fs.rmSync(destFile, { force: true });
  const res = runWrangler(['r2', 'object', 'get', `${BUCKET}/${key}`, '--file', destFile, '--remote'], { cwd: builderDir });
  return res.ok && fs.existsSync(destFile) && fs.statSync(destFile).size > 0;
}

function tarCmd() {
  return process.platform === 'win32' ? 'C:\\Windows\\System32\\tar.exe' : 'tar';
}

function tarRun(args, opts = {}) {
  return spawnSync(tarCmd(), args, { encoding: 'utf8', timeout: 300_000, windowsHide: true, ...opts });
}

let cachedPlaywright = null;
function loadPlaywright() {
  if (cachedPlaywright) return cachedPlaywright;
  try {
    const root = process.platform === 'win32'
      ? execFileSync(process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', 'npm root -g'], { encoding: 'utf8' }).trim()
      : execFileSync('npm', ['root', '-g'], { encoding: 'utf8' }).trim();
    cachedPlaywright = createRequire(path.join(root, '__sync_websites__.cjs'))('playwright');
    return cachedPlaywright;
  } catch {
    return null;
  }
}

async function liveScreenshot(url, destFile) {
  const playwright = loadPlaywright();
  if (!playwright) return false;
  let browser;
  try {
    browser = await playwright.chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    await page.goto(url, { waitUntil: 'networkidle', timeout: 45_000 });
    await page.evaluate(() => { for (const image of document.images) image.loading = 'eager'; });
    await page.evaluate(async () => {
      const step = Math.max(300, Math.floor(window.innerHeight * 0.8));
      for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
        window.scrollTo(0, y);
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
      window.scrollTo(0, 0);
      await new Promise((resolve) => setTimeout(resolve, 300));
    });
    await page.screenshot({ path: destFile, fullPage: true });
    return fs.existsSync(destFile) && fs.statSync(destFile).size > 0;
  } catch {
    return false;
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
}

function pickPreferredShot(files) {
  for (const pref of ['home-1440.png', 'home-390.png']) {
    const hit = files.find((f) => path.basename(f).toLowerCase() === pref);
    if (hit) return hit;
  }
  const homes = files.filter((f) => /^home-\d+\.png$/i.test(path.basename(f)));
  return homes[0] || files[0] || null;
}

function extractHomeShotFromArchive(archive, tmp) {
  const list = tarRun(['-tzf', archive]);
  if (list.status !== 0 || !list.stdout) return null;
  const members = list.stdout.split('\n').map((l) => l.trim()).filter((l) => /\/assets\/qa\/screenshots\/home-\d+\.png$/i.test(l));
  if (!members.length) return null;
  members.sort((a, b) => {
    const rank = (m) => (/home-1440\.png$/i.test(m) ? 0 : /home-390\.png$/i.test(m) ? 1 : 2);
    return rank(a) - rank(b);
  });
  const wanted = members.slice(0, 2);
  const extractDir = path.join(tmp, 'extract');
  fs.mkdirSync(extractDir, { recursive: true });
  const extract = tarRun(['-xzf', archive, '-C', extractDir, ...wanted]);
  if (extract.status !== 0) return null;
  const extracted = wanted
    .map((m) => path.join(extractDir, ...m.split('/')))
    .filter((f) => fs.existsSync(f) && fs.statSync(f).size > 0);
  if (!extracted.length) return null;
  return pickPreferredShot(extracted);
}

async function fetchScreenshot(row, slug, destDir, builderDir) {
  fs.mkdirSync(destDir, { recursive: true });
  const r2Slug = slugify(row.dir_name || row.slug);
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'bd-websites-'));
  try {
    for (const name of ['home-1440.png', 'home-390.png']) {
      const dest = path.join(tmp, name);
      if (r2Get(`builds/${r2Slug}/screenshots/${name}`, dest, builderDir)) {
        const final = path.join(destDir, name);
        fs.copyFileSync(dest, final);
        return final;
      }
    }
    const liveTmp = path.join(tmp, 'home-1440.png');
    if (await liveScreenshot(resolveLiveUrl(row), liveTmp)) {
      const final = path.join(destDir, 'home-1440.png');
      fs.copyFileSync(liveTmp, final);
      return final;
    }
    const archive = path.join(tmp, 'latest-verified.tar.gz');
    if (r2Get(`builds/${r2Slug}/latest-verified.tar.gz`, archive, builderDir)) {
      const picked = extractHomeShotFromArchive(archive, tmp);
      if (picked) {
        const final = path.join(destDir, path.basename(picked));
        fs.copyFileSync(picked, final);
        return final;
      }
    }
    return null;
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

function resolveLiveUrl(row) {
  let url = String(row.url || '').trim();
  if (url && !/^https?:\/\//i.test(url)) url = `https://${url}`;
  if (!/^https?:\/\/.+/i.test(url)) url = `https://${pagesProjectName(row.slug)}.pages.dev`;
  return url;
}

function yamlQuote(value) {
  return `"${String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

function buildMdx(row, slug, screenshotName, liveUrl) {
  const title = String(row.business_name || row.slug || slug);
  const category = String(row.category || '');
  const dateAdded = new Date().toISOString().slice(0, 10);
  const blurb = `Live website designed and built by Byte Digital${category ? ` for a ${category} business` : ''}.`;
  const description = `Homepage screenshot and project details for ${title} — a business website designed and built by Byte Digital.`;
  const screenshot = screenshotName ? `/images/websites/${slug}/${screenshotName}` : '';
  const categoryPhrase = category ? ` — a ${category.toLowerCase()} business` : '';

  const frontmatter = [
    '---',
    `title: ${yamlQuote(title)}`,
    `category: ${yamlQuote(category)}`,
    `blurb: ${yamlQuote(blurb)}`,
    `description: ${yamlQuote(description)}`,
    `liveUrl: ${yamlQuote(liveUrl)}`,
    `screenshot: ${yamlQuote(screenshot)}`,
    `dateAdded: ${dateAdded}`,
    'draft: false',
    '---',
    '',
  ];

  const body = [
    `## About this website`,
    '',
    `This page is dedicated to **${title}**${categoryPhrase} — one of the business websites designed and built by Byte Digital. The screenshot above is the site's live homepage.`,
    '',
    `## Built by Byte Digital`,
    '',
    `Every page is engineered for speed, mobile devices, and search, so ${title} can turn visitors into customers.`,
    '',
    `Want a website like this for your business? [Start your project](/contact/) or [explore our services](/services/web-design/).`,
    '',
  ];

  return [...frontmatter, ...body].join('\n');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log('Usage: node scripts/sync-websites.mjs [--builder-dir <path>] [--force] [--dry-run]');
    return;
  }

  const builderDir = path.resolve(args.builderDir);
  if (!fs.existsSync(path.join(builderDir, 'wrangler.jsonc'))) {
    throw new Error(`builder repo not found at ${builderDir} (expected wrangler.jsonc) — pass --builder-dir <path>`);
  }

  const contentDir = path.join(ROOT, 'src', 'content', 'websites');
  const imageRoot = path.join(ROOT, 'public', 'images', 'websites');
  fs.mkdirSync(contentDir, { recursive: true });

  console.log(`Reading approved sites from builder D1 (${builderDir})...`);
  const rows = fetchApprovedSites(builderDir);
  console.log(`${rows.length} approved site(s) found.\n`);

  const summary = { added: [], refreshed: [], skipped: [], failed: [] };

  for (const row of rows) {
    const slug = slugify(row.slug);
    const mdxPath = path.join(contentDir, `${slug}.mdx`);
    const exists = fs.existsSync(mdxPath);

    if (exists && !args.force) {
      summary.skipped.push(slug);
      if (args.dryRun) console.log(`skip     ${slug}  (page exists; --force re-downloads screenshot)`);
      continue;
    }

    if (args.dryRun) {
      const action = exists ? 'refresh' : 'add   ';
      console.log(`${action}  ${slug}  (${row.business_name || row.slug})`);
      continue;
    }

    try {
      const shot = await fetchScreenshot(row, slug, path.join(imageRoot, slug), builderDir);
      if (!shot) console.warn(`  ! no screenshot found for ${slug} — page will show a placeholder`);

      if (!exists) {
        const liveUrl = resolveLiveUrl(row);
        fs.writeFileSync(mdxPath, buildMdx(row, slug, shot ? path.basename(shot) : '', liveUrl));
        summary.added.push(slug);
        console.log(`added    ${slug}  -> /websites/${slug}/`);
      } else {
        if (shot) {
          const rel = `/images/websites/${slug}/${path.basename(shot)}`;
          let mdx = fs.readFileSync(mdxPath, 'utf8');
          if (/^screenshot: "/m.test(mdx)) mdx = mdx.replace(/^screenshot: ".*"$/m, `screenshot: "${rel}"`);
          else mdx = mdx.replace(/^draft: /m, `screenshot: "${rel}"\ndraft: `);
          fs.writeFileSync(mdxPath, mdx);
        }
        summary.refreshed.push(slug);
        console.log(`refresh  ${slug}  screenshot${shot ? ': ' + path.basename(shot) : ' (none found)'}`);
      }
    } catch (error) {
      summary.failed.push(`${slug}: ${error.message}`);
      console.error(`FAILED   ${slug}: ${error.message}`);
    }
  }

  console.log('\n--- summary ---');
  console.log(`added: ${summary.added.length}  refreshed: ${summary.refreshed.length}  skipped: ${summary.skipped.length}  failed: ${summary.failed.length}`);
  if (args.dryRun) console.log('(dry run — nothing written)');
  if (summary.failed.length) {
    for (const f of summary.failed) console.error(`  ${f}`);
    process.exitCode = 1;
  }
}

try {
  await main();
} catch (error) {
  console.error(`sync-websites failed: ${error.message}`);
  process.exitCode = 1;
}
