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

## Git (Backup)
```bash
git add .
git commit -m "describe changes"
git push origin main
```
