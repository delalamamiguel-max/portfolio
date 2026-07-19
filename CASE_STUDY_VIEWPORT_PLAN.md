# Case-Study Viewport Overlay: Technical Implementation Plan

Phase 3 deliverable. No implementation until you approve. Baseline: `feature/portfolio-audit-fixes`.

## 1. Current architecture (what changes and what does not)

Today `/case-studies/:slug` is a standard route: clicking a homepage card triggers a client-side navigation that unmounts the homepage, renders `CaseStudyDetailPage` (PrivateRoute → session check → authenticated fetch from `/api/content` → `CaseStudyTemplate`), and loses homepage scroll position. Deep dives (`/deep-dive/:slug`) use the identical path. Edge middleware gates the URLs server-side; the admin preview reuses `CaseStudyTemplate` on its own route.

Affected inventory:
- Routes: `/case-studies/:slug`, `/deep-dive/:slug` (overlay targets); `/admin/case-studies/preview/:slug` (stays a full page); `/login` round-trip (`?next=` flow, unchanged).
- Components: `src/App.tsx` (routing core), `src/pages/private-placeholders.tsx` (detail pages), `src/components/case-study/case-study-template.tsx` (reused as-is inside the overlay), `src/components/layout/sticky-side-nav.tsx` (anchor scrolling must become container-aware), `home-page.tsx` CaseStudiesSection (card click carries state), `site-shell.tsx` (no change; overlay renders above it).
- Content/CMS: none. Content sources, the CMS, and the write pipeline are untouched.
- Localization: none exists (English-only site).
- Analytics: none installed (open decision #13). The overlay will expose two clean hook points (`onOpen`, `onClose` with scroll-depth) so events can be added in one place if analytics is approved later.
- Middleware/auth/SEO: untouched. URLs remain gated and `noindex` per your access policy.

## 2. Root architecture: modal routes, not a page-specific workaround

The idiomatic React Router pattern is a **background-location modal route**, implemented once at the routing core:

1. **In-app open.** Card click navigates to `/case-studies/:slug` passing `state: { backgroundLocation: location }`. `App.tsx` renders the main `<Routes location={backgroundLocation ?? location}>` (so the homepage stays mounted, scroll intact) plus a second `<Routes>` that matches the overlay routes and renders `CaseStudyOverlay` on top. No full-page navigation happens; the URL bar updates.
2. **Direct load / shared link / post-login redirect.** The location IS the case-study URL with no background state. The base routes render the homepage as the visual context and the overlay opens on top of it. One code path renders both cases; there is no separate standalone page to drift.
3. **URLs are canonical and shareable.** Nothing about the URL scheme changes. Refresh inside an open overlay reproduces the same view (direct-load path).

### The overlay component (`src/components/case-study/case-study-overlay.tsx`)

A single accessible dialog wrapping the untouched `CaseStudyTemplate`:

- **Semantics:** `role="dialog"`, `aria-modal="true"`, labelled by the case-study title; background marked `inert` while open (with a focus-trap fallback for browsers without `inert`).
- **Close affordances:** sticky close button (top-right, always visible while scrolling), Escape key, backdrop click on desktop; all routes through one `close()`.
- **History behavior:** when opened in-app, `close()` calls `history.back()`, so the browser Back button and the close button are the same action and Back never leaves the portfolio unexpectedly. On direct load, `close()` navigates to `/` with replace, so Back still exits to wherever the visitor came from, which is standard browser behavior.
- **Focus management:** focus moves to the dialog on open; on close, focus returns to the card that opened it (tracked by slug). Direct-load close focuses the case-studies section heading.
- **Scroll management:** body scroll locks using the fixed-body technique (reliable on iOS Safari, preserves position exactly); the overlay is the single scroll container, so there is no nested-scroll ambiguity. On close, body scroll position restores to the pixel.
- **Section anchors:** `StickySideNav` gains an optional scroll-container context so anchor clicks scroll the overlay, not the window. Desktop keeps the side nav; below `lg` it collapses (current behavior preserved).
- **Layout:** desktop/tablet renders a near-full panel (~min(1200px, 94vw) wide, 94vh tall, visible backdrop with the homepage dimmed behind for context); mobile renders a full-screen sheet. Subtle scale/fade transition, disabled under `prefers-reduced-motion`.
- **Loading and error states:** the existing fetch states (loading, not published, error) render inside the overlay with the same close affordances, so a bad slug never traps the user.

### Auth flow detail

Logged-out click on a card: PrivateRoute inside the overlay route redirects to `/login?next=/case-studies/:slug` (full navigation, as today). After login, the direct-load path opens the overlay over the homepage. Middleware behavior for document requests is untouched.

## 3. Files expected to change

| File | Change |
|---|---|
| `src/App.tsx` | Background-location routing core; overlay route group |
| `src/components/case-study/case-study-overlay.tsx` | New dialog component |
| `src/pages/private-placeholders.tsx` | Detail pages become overlay content (fetch logic reused verbatim) |
| `src/pages/home-page.tsx` | Card `Link`s pass background state; section heading id used for direct-load close focus |
| `src/components/layout/sticky-side-nav.tsx` | Container-aware anchor scrolling (backward-compatible prop) |
| `src/index.css` | Overlay/backdrop/scroll-lock styles, reduced-motion variants |
| `src/lib/use-document-title.ts` | No change; overlay pages already set titles |

No API, middleware, content, CMS, or `vercel.json` changes. Estimated complexity: Medium. One feature commit plus one styles/a11y commit, on the feature branch.

## 4. Risks and mitigations

| Risk | Mitigation |
|---|---|
| iOS Safari scroll-lock quirks (rubber-banding, viewport units) | Fixed-body lock + `dvh` units + device testing in validation phase |
| Focus-trap edge cases (portal, dev overlays) | Prefer native `inert`; test keyboard-only traversal both directions |
| Back/refresh matrix regressions | Explicit test matrix (below); close() unified through history |
| Anchor scrolling inside container breaks existing full-page use (admin preview) | Container prop defaults to window; admin preview unchanged |
| Perceived SEO expectations | Gated URLs are intentionally `noindex`; shared links resolve correctly for authenticated viewers and to a clear login gate otherwise. Called out so it is a decision, not a surprise. |

## 5. Phase 5 validation plan (run after implementation)

- **Routing matrix:** open from card / direct URL / refresh mid-overlay / Back / Forward / close via button, Escape, backdrop / post-login redirect / unpublished slug / deep-dive variant.
- **Focus and scroll:** trigger-card focus restore, scroll position restore, no background scroll bleed, overlay scroll isolated.
- **Accessibility:** keyboard-only pass, VoiceOver spot check (dialog announcement, heading order), contrast of close control, reduced-motion.
- **Responsive:** 320, 375, 390, 768, 1024, 1280, 1440; long titles and tag rows inside the overlay.
- **Regression:** homepage filters, nav anchors, theme toggle, admin preview page, login round-trip, `qa:markdown` parity, typecheck, lint, build, and the standard route-gating curl matrix.
- Every meaningful change lands with a plain-English explanation of what changed, files touched, why, and how it was validated.
