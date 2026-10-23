import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { FullPageLoader } from "@/components/ui/spinner";
import { ROUTES } from "@/constants/routes";
import type { UserRole } from "@/types/user";

interface ProtectedRouteProps {
  roles?: UserRole[];
}

export const ProtectedRoute = ({ roles }: ProtectedRouteProps) => {
  const { user, status } = useAuth();
  const location = useLocation();

  if (status === "loading") return <FullPageLoader />;

  if (!user) {
    const callbackUrl = encodeURIComponent(location.pathname + location.search);
    return <Navigate replace to={`${ROUTES.login}?callbackUrl=${callbackUrl}`} />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate replace to={ROUTES.home} />;
  }

  return <Outlet />;
};
