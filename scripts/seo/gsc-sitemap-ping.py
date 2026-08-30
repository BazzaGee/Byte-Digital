"""
Submit the sitemap to Google Search Console.
Run automatically after every deploy via `pnpm postdeploy:production`.
Requires: service account with Full permission on the GSC property.
"""
import sys
from pathlib import Path

from google.oauth2 import service_account
from googleapiclient.discovery import build

CREDS = Path(r"C:\Users\barry\OneDrive\Desktop\Google Analytics & Search Console\google-seo-analytics-agent\credentials\service-account.json")
SITE_URL = "https://bytedigital.co.nz/"
SITEMAP = "https://bytedigital.co.nz/sitemap-index.xml"

creds = service_account.Credentials.from_service_account_file(
    str(CREDS), scopes=["https://www.googleapis.com/auth/webmasters"]
)
svc = build("searchconsole", "v1", credentials=creds)
svc.sitemaps().submit(siteUrl=SITE_URL, feedpath=SITEMAP).execute()

sitemaps = svc.sitemaps().list(siteUrl=SITE_URL).execute()
entries = {
    s["path"]: s.get("lastDownloaded", "?")
    for s in sitemaps.get("sitemap", [])
}
print("Sitemap submitted. Known sitemaps:")
for path, downloaded in entries.items():
    print(f"  {path} (lastDownloaded: {downloaded})")

if SITEMAP not in entries:
    print("WARNING: sitemap not visible yet (may take a moment)")
    sys.exit(1)
print("OK")
