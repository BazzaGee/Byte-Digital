"""
Weekly SEO report: GSC (last 28 days vs previous 28) + GA4 sessions.
Writes markdown to reports/seo-report-<date>.md
Run: pnpm seo:report
"""
from datetime import date, timedelta
from pathlib import Path

from google.oauth2 import service_account
from googleapiclient.discovery import build

ROOT = Path(__file__).resolve().parents[2]
CREDS = Path(r"C:\Users\barry\OneDrive\Desktop\Google Analytics & Search Console\google-seo-analytics-agent\credentials\service-account.json")
SITE_URL = "https://bytedigital.co.nz/"
GA4_PROPERTY = "properties/544274403"

creds = service_account.Credentials.from_service_account_file(
    str(CREDS),
    scopes=[
        "https://www.googleapis.com/auth/webmasters.readonly",
        "https://www.googleapis.com/auth/analytics.readonly",
    ],
)

gsc = build("searchconsole", "v1", credentials=creds)
ga4 = build("analyticsdata", "v1beta", credentials=creds)


def gsc_window(days_back: int, days: int) -> dict:
    end = date.today() - timedelta(days=3)
    start = end - timedelta(days=days - 1) - timedelta(days=days_back)
    end = end - timedelta(days=days_back)
    resp = (
        gsc.searchanalytics()
        .query(
            siteUrl=SITE_URL,
            body={
                "startDate": start.isoformat(),
                "endDate": end.isoformat(),
                "dimensions": ["query"],
                "rowLimit": 15,
            },
        )
        .execute()
    )
    rows = resp.get("rows", [])
    totals = (
        gsc.searchanalytics()
        .query(
            siteUrl=SITE_URL,
            body={
                "startDate": start.isoformat(),
                "endDate": end.isoformat(),
                "dimensions": ["page"],
                "rowLimit": 10,
            },
        )
        .execute()
    )
    return {
        "start": start.isoformat(),
        "end": end.isoformat(),
        "queries": rows,
        "pages": totals.get("rows", []),
    }


def totals(rows_list) -> tuple[int, int, float, float]:
    clicks = sum(r.get("clicks", 0) for r in rows_list)
    impressions = sum(r.get("impressions", 0) for r in rows_list)
    ctr = (clicks / impressions * 100) if impressions else 0.0
    pos = (
        sum(r.get("clicks", 0) * 0 + r.get("impressions", 0) * r.get("position", 0) for r in rows_list)
        / impressions
        if impressions
        else 0.0
    )
    return clicks, impressions, ctr, pos


prev = gsc_window(28, 28)
curr = gsc_window(0, 28)

c_clicks, c_impr, c_ctr, c_pos = totals(curr["queries"])
p_clicks, p_impr, p_ctr, p_pos = totals(prev["queries"])

ga4_rows = (
    ga4.properties()
    .runReport(property=GA4_PROPERTY, body={"dimensions": [{"name": "date"}], "metrics": [{"name": "sessions"}], "dateRanges": [{"startDate": "28daysAgo", "endDate": "yesterday"}]})
    .execute()
    .get("rows", [])
)
ga4_sessions = sum(int(r["metricValues"][0]["value"]) for r in ga4_rows)

lines = [
    f"# SEO Report — generated {date.today().isoformat()}",
    "",
    f"## Google Search Console",
    f"| Metric | Previous 28d ({prev['start']} → {prev['end']}) | Last 28d ({curr['start']} → {curr['end']}) | Delta |",
    f"|---|---|---|---|",
    f"| Clicks | {p_clicks:.0f} | {c_clicks:.0f} | {c_clicks - p_clicks:+.0f} |",
    f"| Impressions | {p_impr:.0f} | {c_impr:.0f} | {c_impr - p_impr:+.0f} |",
    f"| CTR | {p_ctr:.1f}% | {c_ctr:.1f}% | {c_ctr - p_ctr:+.1f}pp |",
    f"| Avg position | {p_pos:.1f} | {c_pos:.1f} | {p_pos - c_pos:+.1f} (lower is better) |",
    "",
    f"**GA4 sessions (last 28d):** {ga4_sessions}",
    "",
    "## Top queries (last 28d)",
    "| Query | Clicks | Impressions | CTR | Position |",
    "|---|---|---|---|---|",
]
for r in curr["queries"]:
    ctr = r.get("ctr", 0) * 100
    lines.append(
        f"| {r['keys'][0]} | {r.get('clicks', 0):.0f} | {r.get('impressions', 0):.0f} | {ctr:.1f}% | {r.get('position', 0):.1f} |"
    )

lines += ["", "## Top pages (last 28d)", "| Page | Clicks | Impressions | Position |", "|---|---|---|---|"]
for r in curr["pages"]:
    lines.append(
        f"| {r['keys'][0]} | {r.get('clicks', 0):.0f} | {r.get('impressions', 0):.0f} | {r.get('position', 0):.1f} |"
    )

out = ROOT / "reports" / f"seo-report-{date.today().isoformat()}.md"
out.parent.mkdir(exist_ok=True)
out.write_text("\n".join(lines), encoding="utf-8")
print(f"Report written: {out}")
print(f"Clicks {p_clicks:.0f} -> {c_clicks:.0f} | Impressions {p_impr:.0f} -> {c_impr:.0f} | GA4 sessions {ga4_sessions}")
