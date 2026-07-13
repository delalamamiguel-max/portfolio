# QA_REPORT

- **Branch/commit tested**: `feature/portfolio-audit-fixes` @ `82d238f` (+ docs commit)
- **Environments**: local (macOS, Node 25, `npm run dev` via Vite; `npm run build`), Vercel preview deployment `portfolio-pvpb0alyp-...vercel.app` (build `5Pg9LBfAUEAhb7s1Twtpy6wWTuu3`, status: success)
- **Browsers**: Chromium-based in-app browser (local dev), user's Chrome (preview, via authenticated session)

## Automated checks
| Check | Result |
|---|---|
| `npm run typecheck` (tsc -b) | PASS |
| `npm run lint` | PASS for changed code — 3 pre-existing errors + 1 warning remain in untouched `docx-case-study-importer.tsx` / `theme-provider.tsx` |
| `npm run build` (includes content validation prebuild) | PASS (main bundle 249 kB → 220 kB) |
| `npm run content:index` | PASS — 5 published entries |
| `npm run qa:markdown` (renderer parity) | PASS |
| GitHub Actions CI on branch | PASS (Vercel deployment: success) |

## Privacy verification (C3)
| Check | Where | Result |
|---|---|---|
| Case-study/deep-dive body text absent from all `dist/assets/*.js` | local build | PASS ("Fluently AI was designed", "Turning Skeptics", "psychographic copy variations", "GPS-verified" → 0 hits) |
| Same check against the **served preview bundle** | preview | PASS (0 hits) |
| Public index contains only slug/title/summary/tags/category | generated JSON | PASS |

## Route & asset gating matrix (preview deployment, no site session)
| Path | Expected | Result |
|---|---|---|
| `/` | 200 public | PASS |
| `/case-studies` (bare) | public redirect page, NOT login | PASS (200, no redirect) |
| `/case-studies/fluently-ai-case-study` | → `/login?next=…` | PASS |
| `/files/cms/resume/…pdf` (was public before) | → login | PASS |
| `/images/cms/case-studies-…webp` (impact screenshots) | → login | PASS |
| `/images/cms/home-profile/…webp` (headshot) | 200 public | PASS |
| `/api/content?domain=case-studies&slug=atlas-case-study` | 401 | PASS |
| `/robots.txt`, `/sitemap.xml` | 200 | PASS |
| `/api/login` → session → `/admin` (API-level, production origin) | 200 chain | PASS (verified pre-change on prod; auth code unchanged) |

## Rendering checks
| Check | Result |
|---|---|
| Document title "Miguel de la Lama — Senior Product Manager \| AI & Platform Products" | PASS (local + preview) |
| Exactly one `<h1>`, sourced from CMS `heroHeadline`, all viewports | PASS |
| 5 case-study cards incl. Atlas, filter categories intact | PASS |
| Footer: "Miguel de la Lama · Senior Product Manager" + LinkedIn + email | PASS |
| OG/Twitter/canonical/JSON-LD present in served HTML | PASS (og:image resolves to `/images/og-profile.jpg`, 200) |
| Login page: context-aware headline + request-access mailto; per-route titles (login/404/detail) | PASS (local) |
| Console errors on fresh load | NONE (earlier buffered entries were mid-edit HMR artifacts; pre-existing list-key warning fixed) |
| Case-study section side-nav restored (7 sections per restructured study) | PASS (structure verified in content; template logic unchanged) |

## Not tested / requires you
1. **Authenticated case-study fetch on Vercel** (`includeFiles` at runtime): needs a site login on the preview — log in and open any case study. Could not be driven without exposing your password (the sandbox correctly blocks credential materialization; noted, not hidden).
2. **Resend delivery end-to-end**: `RESEND_API_KEY` is not set in any environment yet. Verified behavior: without the key the API returns 503 and the UI shows the honest error + mailto fallback (by code path; the fetch to Resend is unreachable until the key exists).
3. **CMS write workflows** (create/edit/import/upload/delete): intentionally NOT tested — `GITHUB_BRANCH=main`, so any CMS save from the preview would commit to production content. Test after merge, or point `GITHUB_BRANCH` at a test branch in a preview env first.
4. **Full responsive matrix (320–1440) and screen-reader pass**: smoke-tested at 375/785/1280 with no overflow; full matrix deferred — the deferred audit items (backdrop-blur cost, reveal-hidden-without-JS, image dimensions/CLS) are unchanged in this batch and remain open recommendations.

## Failures found and fixed during QA
- React list-key warning in `HomePage` (pre-existing, dev-only) — fixed (`82d238f`).
- `qa:markdown` failed on machines without ripgrep — fixed with grep fallback (`547ca1b`).
- Footer `<a>` tag briefly broken by an edit — caught by re-read, fixed before commit.

## Remaining failures
None known in the changed surface. Pre-existing lint debt in the DOCX importer is untouched (cleanup batch candidate).
