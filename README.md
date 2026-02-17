# Architected by Miguel

Strategy x Systems x Scaled Execution.

## Stack
- Vite + React + TypeScript
- Tailwind CSS + shadcn/ui foundations
- Vercel Functions + Edge Middleware for password-gated private routes

## Environment Variables
- Required: `SITE_PASSWORD`

Copy local env:
- `cp .env.example .env`
- Set `SITE_PASSWORD=<your-password>`

## Local Development
1. Install dependencies: `npm install`
2. Start frontend: `npm run dev`
3. For full middleware + API behavior, run with Vercel dev: `npx vercel dev`

## Routes
Public:
- `/`
- `/philosophy`
- `/resume`
- `/contact`
- `/login`

Private:
- `/case-studies`
- `/case-studies/:slug`
- `/deep-dive/:slug`
- `/style-guide`

## Production Deploy (Vercel)
1. Ensure `SITE_PASSWORD` is configured in Vercel for `Production`, `Preview`, and `Development`.
2. Validate locally:
   - `npm run lint`
   - `npm run build`
3. Deploy preview: `vercel`
4. Promote to production: `vercel --prod`

## QA
- Manual checklist: `docs/release-checklist.md`
- Automated smoke checks:
  - `./scripts/qa-smoke.sh https://<your-domain>`
  - `./scripts/qa-smoke.sh https://<your-domain> "<SITE_PASSWORD>"`
