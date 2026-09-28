"""
Ensure GA4 key events exist.

Phase 1 added the free-concept funnel, so the events that matter are now:
  generate_lead            - existing, kept for the legacy contact paths
  tool_used                - existing, free audit / calculators
  free_concept_start       - visitor opened the request form
  free_concept_requested   - request accepted and row written to D1
  free_concept_ready       - visitor saw a finished concept

free_concept_activated is reserved for the paid step-1 conversion and is
deliberately NOT registered yet: it needs to be wired when the activation flow
exists, otherwise it would sit in GA4 reporting as a permanently-zero event.

Idempotent - safe to run repeatedly.
Run: pnpm seo:keyevents
"""
from google.oauth2 import service_account
from googleapiclient.discovery import build

CREDS = r"C:\Users\barry\OneDrive\Desktop\Google Analytics & Search Console\google-seo-analytics-agent\credentials\service-account.json"
PROPERTY = "properties/544274403"

KEY_EVENTS = [
    "generate_lead",
    "tool_used",
    "free_concept_start",
    "free_concept_requested",
    "free_concept_ready",
]

creds = service_account.Credentials.from_service_account_file(
    CREDS, scopes=["https://www.googleapis.com/auth/analytics.edit"]
)
admin = build("analyticsadmin", "v1beta", credentials=creds)

existing = admin.properties().keyEvents().list(parent=PROPERTY).execute()
names = {e["eventName"]: e["name"] for e in existing.get("keyEvents", [])}
print("Existing key events:", names or "none")

for event in KEY_EVENTS:
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
