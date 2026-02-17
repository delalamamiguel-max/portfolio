import { lazy, Suspense, useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { SiteShell } from "@/components/layout/site-shell";
import { verifySession } from "@/lib/auth";

const HomePage = lazy(() => import("@/pages/home-page").then((module) => ({ default: module.HomePage })));
const LoginPage = lazy(() => import("@/pages/login-page").then((module) => ({ default: module.LoginPage })));
const NotFoundPage = lazy(() => import("@/pages/not-found-page").then((module) => ({ default: module.NotFoundPage })));
const PhilosophyPage = lazy(() => import("@/pages/public-placeholders").then((module) => ({ default: module.PhilosophyPage })));
const ResumePage = lazy(() => import("@/pages/public-placeholders").then((module) => ({ default: module.ResumePage })));
const ContactPage = lazy(() => import("@/pages/public-placeholders").then((module) => ({ default: module.ContactPage })));
const CaseStudiesIndexPage = lazy(() =>
  import("@/pages/private-placeholders").then((module) => ({ default: module.CaseStudiesIndexPage })),
);
const CaseStudyDetailPage = lazy(() =>
  import("@/pages/private-placeholders").then((module) => ({ default: module.CaseStudyDetailPage })),
);
const DeepDiveDetailPage = lazy(() =>
  import("@/pages/private-placeholders").then((module) => ({ default: module.DeepDiveDetailPage })),
);
const StyleGuidePage = lazy(() => import("@/pages/style-guide-page").then((module) => ({ default: module.StyleGuidePage })));

function PrivateRoute({ children }: { children: JSX.Element }) {
  const location = useLocation();
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;

    verifySession().then((authenticated) => {
      if (mounted) {
        setAllowed(authenticated);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  if (allowed === null) {
    return <div className="container py-12 text-muted-text">Checking access...</div>;
  }

  if (!allowed) {
    return <Navigate to={`/login?next=${encodeURIComponent(`${location.pathname}${location.search}`)}`} replace />;
  }

  return children;
}

export default function App() {
  return (
    <SiteShell>
      <Suspense fallback={<div className="container py-12 text-muted-text">Loading page...</div>}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/philosophy" element={<PhilosophyPage />} />
          <Route path="/resume" element={<ResumePage />} />
          <Route path="/contact" element={<ContactPage />} />

          <Route
            path="/case-studies"
            element={
              <PrivateRoute>
                <CaseStudiesIndexPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/case-studies/:slug"
            element={
              <PrivateRoute>
                <CaseStudyDetailPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/deep-dive/:slug"
            element={
              <PrivateRoute>
                <DeepDiveDetailPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/style-guide"
            element={
              <PrivateRoute>
                <StyleGuidePage />
              </PrivateRoute>
            }
          />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </SiteShell>
  );
}
