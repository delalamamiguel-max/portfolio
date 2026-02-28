import { lazy, Suspense, useEffect, useState } from "react";
import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { SiteShell } from "@/components/layout/site-shell";
import { V2Shell } from "@/components/v2/v2-shell";
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
const V2HomePage = lazy(() => import("@/pages/v2/v2-home-page").then((module) => ({ default: module.V2HomePage })));
const V2CaseStudiesIndexPage = lazy(() =>
  import("@/pages/v2/v2-case-studies-index-page").then((module) => ({ default: module.V2CaseStudiesIndexPage })),
);
const V2CaseStudyDetailPage = lazy(() =>
  import("@/pages/v2/v2-case-study-detail-page").then((module) => ({ default: module.V2CaseStudyDetailPage })),
);
const V2PhilosophyPage = lazy(() => import("@/pages/v2/v2-philosophy-page").then((module) => ({ default: module.V2PhilosophyPage })));
const V2ResumePage = lazy(() => import("@/pages/v2/v2-resume-page").then((module) => ({ default: module.V2ResumePage })));
const V2ContactPage = lazy(() => import("@/pages/v2/v2-contact-page").then((module) => ({ default: module.V2ContactPage })));

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

function V2Layout() {
  return (
    <V2Shell>
      <Outlet />
    </V2Shell>
  );
}

export default function App() {
  return (
    <Suspense fallback={<div className="container py-12 text-muted-text">Loading page...</div>}>
      <Routes>
        <Route element={<SiteShell />}>
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
          <Route
            path="/admin"
            element={
              <PrivateRoute>
                <AdminHomePage />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/pages"
            element={
              <PrivateRoute>
                <AdminPagesPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/philosophy"
            element={
              <PrivateRoute>
                <AdminPhilosophyPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/case-studies"
            element={
              <PrivateRoute>
                <AdminCaseStudiesPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/case-studies/preview/:slug"
            element={
              <PrivateRoute>
                <AdminCaseStudyPreviewPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/deep-dive"
            element={
              <PrivateRoute>
                <AdminDeepDivePage />
              </PrivateRoute>
            }
          />
        </Route>

        <Route path="/v2" element={<V2Layout />}>
          <Route index element={<V2HomePage />} />
          <Route path="case-studies" element={<V2CaseStudiesIndexPage />} />
          <Route path="case-studies/:slug" element={<V2CaseStudyDetailPage />} />
          <Route path="philosophy" element={<V2PhilosophyPage />} />
          <Route path="resume" element={<V2ResumePage />} />
          <Route path="contact" element={<V2ContactPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
