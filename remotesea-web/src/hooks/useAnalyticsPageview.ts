import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { trackPageview } from "@/services/analytics";

export const useAnalyticsPageview = (): void => {
  const location = useLocation();

  useEffect(() => {
    trackPageview(location.pathname + location.search);
  }, [location]);
};