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

## Contact Form Worker
Only needed if you change `worker/src/index.ts`:
```bash
cd worker && wrangler deploy && cd ..
```

## Git (Backup)
```bash
git add .
git commit -m "describe changes"
git push origin main
```
