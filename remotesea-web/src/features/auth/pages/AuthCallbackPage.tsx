import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/toast";
import { FullPageLoader } from "@/components/ui/spinner";
import { ROUTES } from "@/constants/routes";

/**
 * Landing target for the backend's OAuth redirect:
 * `<FRONTEND_URL>/auth/callback?token=<accessToken>` (see remotesea-api docs/API.md, GET /auth/google|github).
 */
export function AuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { loginWithToken } = useAuth();
  const { toast } = useToast();
  const ranOnce = useRef(false);

  useEffect(() => {
    if (ranOnce.current) return;
    ranOnce.current = true;

    const token = searchParams.get("token");
    if (!token) {
      toast({ title: "Sign in failed", description: "Missing authentication token.", variant: "error" });
      navigate(ROUTES.login, { replace: true });
      return;
    }

    loginWithToken(token)
      .then((user) => {
        navigate(user.role === "EMPLOYER" ? ROUTES.employerDashboard : ROUTES.talent, { replace: true });
      })
      .catch(() => {
        toast({ title: "Sign in failed", description: "Please try again.", variant: "error" });
        navigate(ROUTES.login, { replace: true });
      });
  }, [searchParams, loginWithToken, navigate, toast]);

  return <FullPageLoader />;
}
