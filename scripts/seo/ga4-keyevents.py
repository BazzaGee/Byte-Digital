"""
Ensure GA4 key events exist (generate_lead, tool_used).
Idempotent - safe to run repeatedly.
Run: pnpm seo:keyevents
"""
from google.oauth2 import service_account
from googleapiclient.discovery import build

CREDS = r"C:\Users\barry\OneDrive\Desktop\Google Analytics & Search Console\google-seo-analytics-agent\credentials\service-account.json"
PROPERTY = "properties/544274403"

creds = service_account.Credentials.from_service_account_file(
    CREDS, scopes=["https://www.googleapis.com/auth/analytics.edit"]
)
admin = build("analyticsadmin", "v1beta", credentials=creds)

existing = admin.properties().keyEvents().list(parent=PROPERTY).execute()
names = {e["eventName"]: e["name"] for e in existing.get("keyEvents", [])}
print("Existing key events:", names or "none")

for event in ["generate_lead", "tool_used"]:
    if event in names:
        print(f"{event}: already a key event")
        continue
    created = (
        admin.properties()
        .keyEvents()
        .create(parent=PROPERTY, body={"eventName": event, "countingMethod": "ONCE_PER_EVENT"})
        .execute()
    )
    print(f"{event}: CREATED -> {created.get('name')}")

print("OK")
