import { useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { FullPageLoader } from "@/components/ui/spinner";
import { ROUTES } from "@/constants/routes";

/**
 * Redirects to home if the user is *already* authenticated when this route mounts
 * (e.g. visiting /login while signed in). The decision is locked in the first time
 * auth status resolves and never re-evaluated after that: login/register forms
 * navigate away themselves on success, and reacting to `user` turning truthy live
 * (mid-submit, before that explicit navigate runs) would race it and can bounce to
 * the wrong destination.
 */
export function GuestOnlyRoute() {
  const { user, status } = useAuth();
  const [decided, setDecided] = useState<boolean | null>(() => (status === "loading" ? null : !!user));
  const [lastStatus, setLastStatus] = useState(status);

  // Adjusting state during render (not in an effect) so the decision is locked in
  // within the same render pass status first resolves, before any competing navigation.
  if (status !== lastStatus) {
    setLastStatus(status);
    if (decided === null && status !== "loading") {
      setDecided(!!user);
    }
  }

  if (status === "loading" || decided === null) return <FullPageLoader />;
  if (decided) return <Navigate replace to={ROUTES.home} />;

  return <Outlet />;
}
