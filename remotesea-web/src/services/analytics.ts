export const initAnalytics = (): void => {
  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;
  if (!measurementId || !import.meta.env.PROD) return; // no-op without an ID, and never in dev

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer ?? [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer.push(args);
  };
  window.gtag("js", new Date());
  // Automatic pageview-on-load only fires once per full page load, missing every
  // client-side route change — pageviews are sent manually via useAnalyticsPageview.
  window.gtag("config", measurementId, { send_page_view: false });
};

export const trackPageview = (path: string): void => {
  if (typeof window.gtag !== "function") return;
  window.gtag("event", "page_view", { page_path: path });
};
