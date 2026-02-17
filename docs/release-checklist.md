# Release Checklist

## Pre-Deploy
1. Ensure `SITE_PASSWORD` is set in Vercel (`Production`, `Preview`, `Development`).
2. Run `npm ci`.
3. Run `npm run lint`.
4. Run `npm run build`.
5. Run smoke tests locally:
   - `./scripts/qa-smoke.sh http://localhost:3000`
   - `./scripts/qa-smoke.sh http://localhost:3000 "<SITE_PASSWORD>"`

## Deploy
1. Pull latest from main branch.
2. Deploy to preview (`vercel`) and validate private-route redirects.
3. Validate login/logout, `next` redirect flow, and mobile nav/focus behavior.
4. Promote to production (`vercel --prod`).

## Post-Deploy
1. Run smoke tests against production URL:
   - `./scripts/qa-smoke.sh https://<your-domain>`
   - `./scripts/qa-smoke.sh https://<your-domain> "<SITE_PASSWORD>"`
2. Confirm private routes are inaccessible without session.
3. Confirm `/resume.pdf` downloads.
4. Confirm contact form returns success and logs intake metadata server-side.
