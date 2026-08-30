/**
 * Ping IndexNow (Bing, Yandex, Seznam, Naver) with the full sitemap URL list.
 * Runs automatically after every deploy. Key file lives at /3df6d3dfccdf4e2ebb324543dc5f4216.txt
 */
const KEY = '3df6d3dfccdf4e2ebb324543dc5f4216';
const SITEMAP = 'https://bytedigital.co.nz/sitemap-0.xml';
const ENDPOINT = 'https://api.indexnow.org/indexnow';

async function main() {
  const res = await fetch(SITEMAP);
  if (!res.ok) throw new Error(`sitemap fetch failed: ${res.status}`);
  const xml = await res.text();
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  if (urls.length === 0) throw new Error('no urls found in sitemap');

  const body = {
    host: 'bytedigital.co.nz',
    key: KEY,
    keyLocation: `https://bytedigital.co.nz/${KEY}.txt`,
    urlList: urls,
  };

  const ping = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(body),
  });

  console.log(`IndexNow: submitted ${urls.length} URLs -> HTTP ${ping.status}`);
  if (!ping.ok && ping.status !== 202 && ping.status !== 200) {
    throw new Error(`indexnow ping failed: ${ping.status}`);
  }
  console.log('OK');
}

main().catch((err) => {
  console.error('IndexNow ping failed:', err.message);
  process.exit(1);
});
