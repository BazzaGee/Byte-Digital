# Byte Digital — Deploy Guide

## Staging (Test First)
```bash
pnpm build && pnpm deploy:staging
```
Live at: https://staging.byte-digital.pages.dev

## Production (Live Site)
```bash
pnpm build && pnpm deploy:production
```
Live at: https://bytedigital.co.nz

## Contact Form
The contact form uses a Cloudflare Pages Function (`functions/api/contact.ts`).
It deploys automatically with every `wrangler pages deploy` — no separate step needed.

### Secrets
If you need to rotate the Resend API key:
```bash
wrangler pages secret put RESEND_API_KEY --project-name byte-digital          # production
wrangler pages secret put RESEND_API_KEY --project-name byte-digital --env preview  # staging/previews
```

### From address
Currently sends from `onboarding@resend.dev` (test domain).
Once `bytedigital.co.nz` is verified on Resend, update the `from` field in `functions/api/contact.ts`.

## Chatbot (`/api/chat`)
The website chatbot is a self-hosted Cloudflare Pages Function at `functions/api/chat.ts`. It runs the full agent (keyword retrieval over `public/data/site-content.json` + Cloudflare KV memory + OpenRouter streaming) and streams NDJSON back to `ChatWidget.astro`. The legacy n8n workflow (`byte-digital-chatbot`) is left untouched but no longer called — the widget now posts to `/api/chat` on the same domain.

It deploys automatically with every `wrangler pages deploy` (same as the contact form).

### Bindings & secrets
Chat history is stored in a **Cloudflare KV** namespace, bound as `CHAT_HISTORY` in `wrangler.toml` (namespace `79c4c49e5f7d4420a5d2993e0919d47c`). No database key required. The only secret the function needs is the OpenRouter API key:
```bash
# production
wrangler pages secret put OPENROUTER_API_KEY --project-name byte-digital
# staging / previews
wrangler pages secret put OPENROUTER_API_KEY --project-name byte-digital --env preview
```
If a KV namespace ever needs recreating:
```bash
wrangler kv namespace create CHAT_HISTORY
# then update the id in wrangler.toml
```

### Optional: Google Sheets chat log (parity with n8n)
To log each chat to a Google Sheet, add a service account:
```bash
wrangler pages secret put GOOGLE_SHEET_ID --project-name byte-digital
wrangler pages secret put GOOGLE_SERVICE_ACCOUNT_EMAIL --project-name byte-digital
wrangler pages secret put GOOGLE_PRIVATE_KEY --project-name byte-digital
```
Grant the service account edit access to the sheet. If these are omitted, the chatbot still works fully — logging is silently skipped.

### Re-indexing the knowledge base
When site content changes, rebuild the JSON (happens automatically during `pnpm build`):
```bash
pnpm build
```
The Pinecone re-index (`scripts/index-to-pinecone.mjs`) is not used by the live chatbot — retrieval is keyword-based over `site-content.json`.

## Git (Backup)
```bash
git add .
git commit -m "describe changes"
git push origin main
```
