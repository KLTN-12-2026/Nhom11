import * as Sentry from "@sentry/react";

const TRACES_SAMPLE_RATE = 0.2;
const REPLAY_SESSION_SAMPLE_RATE = 0.1; // 10% of normal sessions
const REPLAY_ERROR_SAMPLE_RATE = 1.0; // 100% of sessions that hit an error

export const initMonitoring = (): void => {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn || !import.meta.env.PROD) return; // no-op without a DSN, and never in dev
  Sentry.init({
    dsn,
    integrations: [Sentry.browserTracingIntegration(), Sentry.replayIntegration()],
    tracesSampleRate: TRACES_SAMPLE_RATE,
    replaysSessionSampleRate: REPLAY_SESSION_SAMPLE_RATE,
    replaysOnErrorSampleRate: REPLAY_ERROR_SAMPLE_RATE,
  });
};

export const reportError = (error: unknown, componentStack?: string): void => {
  Sentry.captureException(
    error,
    componentStack ? { contexts: { react: { componentStack } } } : undefined
  );
};
