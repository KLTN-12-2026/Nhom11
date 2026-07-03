import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import { RootLayout } from "@/layouts/RootLayout";
import { GuestOnlyRoute } from "@/router/GuestOnlyRoute";
import { ProtectedRoute } from "@/router/ProtectedRoute";
import { FullPageLoader } from "@/components/ui/spinner";

const HomePage = lazy(() => import("@/pages/HomePage").then((m) => ({ default: m.HomePage })));
const NotFoundPage = lazy(() =>
  import("@/pages/NotFoundPage").then((m) => ({ default: m.NotFoundPage }))
);
const SalaryPage = lazy(() => import("@/pages/SalaryPage").then((m) => ({ default: m.SalaryPage })));
const BlogPage = lazy(() => import("@/pages/BlogPage").then((m) => ({ default: m.BlogPage })));
const CommunityPage = lazy(() =>
  import("@/pages/CommunityPage").then((m) => ({ default: m.CommunityPage }))
);

const LoginPage = lazy(() =>
  import("@/features/auth/pages/LoginPage").then((m) => ({ default: m.LoginPage }))
);
const RegisterPage = lazy(() =>
  import("@/features/auth/pages/RegisterPage").then((m) => ({ default: m.RegisterPage }))
);
const ForgotPasswordPage = lazy(() =>
  import("@/features/auth/pages/ForgotPasswordPage").then((m) => ({ default: m.ForgotPasswordPage }))
);
const ResetPasswordPage = lazy(() =>
  import("@/features/auth/pages/ResetPasswordPage").then((m) => ({ default: m.ResetPasswordPage }))
);
const AuthCallbackPage = lazy(() =>
  import("@/features/auth/pages/AuthCallbackPage").then((m) => ({ default: m.AuthCallbackPage }))
);

const JobsPage = lazy(() =>
  import("@/features/jobs/pages/JobsPage").then((m) => ({ default: m.JobsPage }))
);
const JobDetailPage = lazy(() =>
  import("@/features/jobs/pages/JobDetailPage").then((m) => ({ default: m.JobDetailPage }))
);

const ProfilePage = lazy(() =>
  import("@/features/talent/pages/ProfilePage").then((m) => ({ default: m.ProfilePage }))
);
const TalentDashboardPage = lazy(() =>
  import("@/features/talent/pages/TalentDashboardPage").then((m) => ({
    default: m.TalentDashboardPage,
  }))
);
const PublicTalentProfilePage = lazy(() =>
  import("@/features/talent/pages/PublicTalentProfilePage").then((m) => ({
    default: m.PublicTalentProfilePage,
  }))
);

const EmployerMarketingPage = lazy(() =>
  import("@/features/employer/pages/EmployerMarketingPage").then((m) => ({
    default: m.EmployerMarketingPage,
  }))
);
const EmployerDashboardPage = lazy(() =>
  import("@/features/employer/pages/EmployerDashboardPage").then((m) => ({
    default: m.EmployerDashboardPage,
  }))
);
const PostJobPage = lazy(() =>
  import("@/features/post-job/pages/PostJobPage").then((m) => ({ default: m.PostJobPage }))
);
const PostJobSuccessPage = lazy(() =>
  import("@/features/post-job/pages/PostJobSuccessPage").then((m) => ({
    default: m.PostJobSuccessPage,
  }))
);

const AlertsPage = lazy(() =>
  import("@/features/alerts/pages/AlertsPage").then((m) => ({ default: m.AlertsPage }))
);

const SettingsPage = lazy(() =>
  import("@/features/settings/pages/SettingsPage").then((m) => ({ default: m.SettingsPage }))
);

const AdminPage = lazy(() =>
  import("@/features/admin/pages/AdminPage").then((m) => ({ default: m.AdminPage }))
);

export function AppRouter() {
  return (
    <Suspense fallback={<FullPageLoader />}>
      <Routes>
        <Route element={<RootLayout />} path="/">
          <Route index element={<HomePage />} />

          <Route element={<GuestOnlyRoute />}>
            <Route element={<LoginPage />} path="login" />
            <Route element={<RegisterPage />} path="register" />
            <Route element={<ForgotPasswordPage />} path="forgot-password" />
            <Route element={<ResetPasswordPage />} path="reset-password" />
          </Route>

          <Route element={<AuthCallbackPage />} path="auth/callback" />

          <Route element={<JobsPage />} path="jobs" />
          <Route element={<JobDetailPage />} path="jobs/:id" />

          <Route element={<SalaryPage />} path="salary" />
          <Route element={<BlogPage />} path="blog" />
          <Route element={<CommunityPage />} path="community" />

          <Route element={<EmployerMarketingPage />} path="employer" />
          <Route element={<PostJobSuccessPage />} path="post-job/success" />
          <Route element={<PublicTalentProfilePage />} path="talent/:slug" />

          <Route element={<ProtectedRoute />}>
            <Route element={<ProfilePage />} path="profile" />
            <Route element={<TalentDashboardPage />} path="talent" />
            <Route element={<EmployerDashboardPage />} path="employer-dashboard" />
            <Route element={<PostJobPage />} path="post-job" />
            <Route element={<AlertsPage />} path="alerts" />
            <Route element={<SettingsPage />} path="settings" />
          </Route>

          <Route element={<ProtectedRoute roles={["ADMIN"]} />}>
            <Route element={<AdminPage />} path="admin" />
          </Route>

          <Route element={<NotFoundPage />} path="*" />
        </Route>
      </Routes>
    </Suspense>
  );
}
