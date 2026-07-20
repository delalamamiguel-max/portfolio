import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { matchPath, Navigate, Route, Routes, useLocation, useParams, type Location } from "react-router-dom";
import { SiteShell } from "@/components/layout/site-shell";
import { CaseStudyOverlay } from "@/components/case-study/case-study-overlay";
import { verifySession } from "@/lib/auth";
import { PUBLIC_CASE_STUDY_SLUGS } from "@/lib/case-study-access";

const HomePage = lazy(() => import("@/pages/home-page").then((module) => ({ default: module.HomePage })));
const LoginPage = lazy(() => import("@/pages/login-page").then((module) => ({ default: module.LoginPage })));
const NotFoundPage = lazy(() => import("@/pages/not-found-page").then((module) => ({ default: module.NotFoundPage })));
const CaseStudyDetailPage = lazy(() =>
  import("@/pages/private-placeholders").then((module) => ({ default: module.CaseStudyDetailPage })),
);
const DeepDiveDetailPage = lazy(() =>
  import("@/pages/private-placeholders").then((module) => ({ default: module.DeepDiveDetailPage })),
);
const StyleGuidePage = lazy(() => import("@/pages/style-guide-page").then((module) => ({ default: module.StyleGuidePage })));
const AdminHomePage = lazy(() => import("@/pages/admin/admin-home").then((module) => ({ default: module.AdminHomePage })));
const AdminPagesPage = lazy(() => import("@/pages/admin/admin-pages").then((module) => ({ default: module.AdminPagesPage })));
const AdminPhilosophyPage = lazy(() =>
  import("@/pages/admin/admin-philosophy").then((module) => ({ default: module.AdminPhilosophyPage })),
);
const AdminCaseStudiesPage = lazy(() =>
  import("@/pages/admin/admin-case-studies").then((module) => ({ default: module.AdminCaseStudiesPage })),
);
const AdminCaseStudyPreviewPage = lazy(() =>
  import("@/pages/admin/admin-case-study-preview").then((module) => ({ default: module.AdminCaseStudyPreviewPage })),
);
const AdminDeepDivePage = lazy(() =>
  import("@/pages/admin/admin-deep-dive").then((module) => ({ default: module.AdminDeepDivePage })),
);

type RequiredScope = "any" | "admin" | "caseStudies" | "resume";

/** requireScope: "admin" for CMS/admin surfaces, "caseStudies"/"resume" for
 * the two viewer content scopes (admin always satisfies both), "any" for any
 * authenticated session. */
function PrivateRoute({ children, requireScope = "any" }: { children: JSX.Element; requireScope?: RequiredScope }) {
  const location = useLocation();
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;

    verifySession().then((session) => {
      if (!mounted) return;
      if (requireScope === "admin") setAllowed(session.scope === "admin");
      else if (requireScope === "caseStudies") setAllowed(session.caseStudies);
      else if (requireScope === "resume") setAllowed(session.resume);
      else setAllowed(session.authenticated);
    });

    return () => {
      mounted = false;
    };
  }, [requireScope]);

  if (allowed === null) {
    return <div className="container py-12 text-muted-text">Checking access...</div>;
  }

  if (!allowed) {
    return <Navigate to={`/login?next=${encodeURIComponent(`${location.pathname}${location.search}`)}`} replace />;
  }

  return children;
}

/** Case studies split into two access tiers (see PUBLIC_CASE_STUDY_SLUGS):
 * public slugs render with no auth check at all; everything else goes
 * through the normal admin-or-viewer gate. */
function CaseStudyAccessGate({ children }: { children: JSX.Element }) {
  const { slug } = useParams();

  if (slug && PUBLIC_CASE_STUDY_SLUGS.has(slug)) {
    return children;
  }

  return <PrivateRoute requireScope="caseStudies">{children}</PrivateRoute>;
}

const OVERLAY_PATTERNS = ["/case-studies/:slug", "/deep-dive/:slug"];

export default function App() {
  const location = useLocation();
  const state = location.state as { backgroundLocation?: Location } | null;
  const backgroundLocation = state?.backgroundLocation ?? null;
  const overlayOpen = OVERLAY_PATTERNS.some((pattern) => matchPath(pattern, location.pathname));
  const baseRef = useRef<HTMLDivElement>(null);

  // While the overlay is open, the page behind it is inert: unreachable by
  // keyboard and hidden from assistive technology.
  useEffect(() => {
    const element = baseRef.current;
    if (!element) return;

    if (overlayOpen) {
      element.setAttribute("inert", "");
    } else {
      element.removeAttribute("inert");
    }
  }, [overlayOpen]);

  return (
    <Suspense fallback={<div className="container py-12 text-muted-text">Loading page...</div>}>
      <div ref={baseRef}>
      <Routes location={backgroundLocation ?? location}>
        <Route element={<SiteShell />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/case-studies" element={<Navigate to="/#case-studies" replace />} />
          {/* Overlay URLs render the homepage as the visual context; the
              overlay itself is matched against the real location below. */}
          <Route path="/case-studies/:slug" element={<HomePage />} />
          <Route path="/philosophy" element={<Navigate to="/" replace />} />
          <Route path="/resume" element={<Navigate to="/#resume" replace />} />
          <Route path="/contact" element={<Navigate to="/#contact" replace />} />
          <Route path="/deep-dive/:slug" element={<HomePage />} />
          <Route
            path="/style-guide"
            element={
              <PrivateRoute requireScope="admin">
                <StyleGuidePage />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <PrivateRoute requireScope="admin">
                <AdminHomePage />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/pages"
            element={
              <PrivateRoute requireScope="admin">
                <AdminPagesPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/philosophy"
            element={
              <PrivateRoute requireScope="admin">
                <AdminPhilosophyPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/case-studies"
            element={
              <PrivateRoute requireScope="admin">
                <AdminCaseStudiesPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/case-studies/preview/:slug"
            element={
              <PrivateRoute requireScope="admin">
                <AdminCaseStudyPreviewPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/deep-dive"
            element={
              <PrivateRoute requireScope="admin">
                <AdminDeepDivePage />
              </PrivateRoute>
            }
          />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      </div>

      {overlayOpen ? (
        <Suspense fallback={null}>
          <Routes>
            <Route
              path="/case-studies/:slug"
              element={
                <CaseStudyOverlay hasBackground={Boolean(backgroundLocation)}>
                  <CaseStudyAccessGate>
                    <CaseStudyDetailPage />
                  </CaseStudyAccessGate>
                </CaseStudyOverlay>
              }
            />
            <Route
              path="/deep-dive/:slug"
              element={
                <CaseStudyOverlay hasBackground={Boolean(backgroundLocation)}>
                  <PrivateRoute requireScope="admin">
                    <DeepDiveDetailPage />
                  </PrivateRoute>
                </CaseStudyOverlay>
              }
            />
            <Route path="*" element={null} />
          </Routes>
        </Suspense>
      ) : null}
    </Suspense>
  );
}
